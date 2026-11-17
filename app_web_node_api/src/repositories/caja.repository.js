// src/repositories/caja.repository.js
import { pool } from '../config/db.js';

export async function abierta(cajeroId) {
  const { rows } = await pool.query(`SELECT * FROM cajas WHERE cajero_id = $1 AND estado = 'abierta'`, [cajeroId]);
  return rows[0] ?? null;
}

export async function abrir(cajeroId, montoInicial) {
  const { rows } = await pool.query(`INSERT INTO cajas (cajero_id, monto_inicial) VALUES ($1, $2) RETURNING *`, [cajeroId, montoInicial]);
  return rows[0];
}

// Cobros del cajero desde que abrió la caja, por medio de pago
export async function totales(caja) {
  const { rows } = await pool.query(
    `SELECT metodo, COUNT(*)::int AS operaciones, COALESCE(SUM(monto), 0) AS total FROM pagos
      WHERE id_cajero = $1 AND fecha >= $2 GROUP BY metodo`, [caja.cajero_id, caja.apertura]);
  return rows;
}

export async function cobros(caja) {
  const { rows } = await pool.query(
    `SELECT p.codigo_operacion, p.entidad, p.id_entidad, p.metodo, p.monto, p.monto_recibido, p.vuelto, p.fecha,
            COALESCE(cp.codigo, e.codigo) AS codigo, u.nombre AS cliente
       FROM pagos p
       LEFT JOIN compras_pasajes cp ON p.entidad = 'pasaje' AND cp.id = p.id_entidad
       LEFT JOIN reservas_estacionamiento e ON p.entidad = 'reserva' AND e.id = p.id_entidad
       JOIN usuarios u ON u.id = p.id_usuario
      WHERE p.id_cajero = $1 AND p.fecha >= $2 ORDER BY p.fecha DESC`, [caja.cajero_id, caja.apertura]);
  return rows;
}

export async function cerrar(id, { esperado, contado, nota }) {
  const { rows } = await pool.query(
    `UPDATE cajas SET cierre = NOW(), efectivo_esperado = $2::numeric, efectivo_contado = $3::numeric, diferencia = $3::numeric - $2::numeric, nota = $4, estado = 'cerrada'
      WHERE id = $1 AND estado = 'abierta' RETURNING *`, [id, esperado, contado, nota]);
  return rows[0] ?? null;
}

// Pendientes de pago de los módulos que atiende el cajero (pasajes y/o reservas)
export async function pendientes({ buscar = '', pasajes, reservas }) {
  const patron = `%${buscar.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await pool.query(`
    SELECT * FROM (
      SELECT 'pasaje' AS entidad, p.id, p.codigo, u.nombre AS cliente, u.correo,
             r.origen || ' → ' || r.destino || ' · asiento ' || p.asiento AS detalle, p.precio AS monto, p.fecha_salida AS fecha
        FROM compras_pasajes p JOIN rutas r ON r.id = p.id_ruta JOIN usuarios u ON u.id = p.id_usuario
       WHERE $2 AND p.estado = 'registrado'
      UNION ALL
      SELECT 'reserva', e.id, e.codigo, u.nombre, u.correo,
             'Placa ' || e.placa || ' · ' || trim_scale(e.horas) || ' h', e.monto, e.fecha_hora_entrada
        FROM reservas_estacionamiento e JOIN usuarios u ON u.id = e.id_usuario
       WHERE $3 AND e.estado = 'registrado'
    ) x
    WHERE ($1 = '%%' OR x.codigo ILIKE $1 OR x.cliente ILIKE $1 OR x.correo ILIKE $1 OR x.detalle ILIKE $1)
    ORDER BY x.fecha LIMIT 50`, [patron, pasajes, reservas]);
  return rows;
}
