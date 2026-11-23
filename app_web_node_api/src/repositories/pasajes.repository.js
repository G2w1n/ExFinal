// src/repositories/pasajes.repository.js
import { pool } from '../config/db.js';
import { codigoDe } from '../utils/codigos.js';

const SELECT_PASAJE = `
  SELECT p.*, r.origen, r.destino, r.duracion_horas, u.nombre AS cliente, u.correo AS correo_cliente,
         e.codigo AS reserva_codigo, e.estado AS reserva_estado
    FROM compras_pasajes p
    JOIN rutas r ON r.id = p.id_ruta
    JOIN usuarios u ON u.id = p.id_usuario
    LEFT JOIN reservas_estacionamiento e ON e.id_pasaje = p.id AND e.estado <> 'cancelado'`;

export async function rutas() {
  const { rows } = await pool.query(`SELECT id, origen, destino, duracion_horas, to_char(hora_salida, 'HH24:MI') AS hora_salida
                                       FROM rutas WHERE activo ORDER BY destino = 'Cusco' DESC, origen, destino`);
  return rows;
}

export async function ruta(id) {
  const { rows } = await pool.query(`SELECT *, to_char(hora_salida, 'HH24:MI') AS hora_salida FROM rutas WHERE id = $1 AND activo`, [id]);
  return rows[0] ?? null;
}

export async function asientosOcupados(idRuta, fechaSalida, excepto = 0) {
  const { rows } = await pool.query(
    `SELECT asiento FROM compras_pasajes WHERE id_ruta = $1 AND fecha_salida = $2 AND estado <> 'cancelado' AND id <> $3`,
    [idRuta, fechaSalida, excepto]);
  return rows.map((f) => f.asiento);
}

// Asientos vendidos por día de una ruta (para pintar el calendario: lleno, pocos, libre)
export async function vendidosPorDia(idRuta, desde, dias) {
  const { rows } = await pool.query(
    `SELECT to_char(fecha_salida::date, 'YYYY-MM-DD') AS fecha, COUNT(*)::int AS vendidos
       FROM compras_pasajes
      WHERE id_ruta = $1 AND estado <> 'cancelado' AND fecha_salida::date BETWEEN $2::date AND $2::date + $3::int
      GROUP BY 1 ORDER BY 1`, [idRuta, desde, dias]);
  return rows;
}

export async function crear(db, d) {
  const { rows: [{ id }] } = await db.query(`SELECT nextval(pg_get_serial_sequence('compras_pasajes', 'id'))::int AS id`);
  await db.query(
    `INSERT INTO compras_pasajes (id, codigo, id_usuario, id_ruta, fecha_salida, hora_llegada, asiento, tipo_asiento, equipaje_kg, precio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, codigoDe('PAS', id), d.idUsuario, d.idRuta, d.fechaSalida, d.horaLlegada, d.asiento, d.tipoAsiento, d.equipajeKg, d.precio]);
  return id;
}

export async function porId(id, db = pool, bloquear = false) {
  const { rows } = await db.query(bloquear
    ? `SELECT * FROM compras_pasajes WHERE id = $1 FOR UPDATE`
    : `${SELECT_PASAJE} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function deUsuario(idUsuario) {
  const { rows } = await pool.query(`${SELECT_PASAJE} WHERE p.id_usuario = $1 ORDER BY p.fecha_salida DESC`, [idUsuario]);
  return rows;
}

export async function listar({ buscar = '', estado = '', fecha = '' }) {
  const patron = `%${buscar.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await pool.query(
    `${SELECT_PASAJE}
      WHERE ($1 = '%%' OR p.codigo ILIKE $1 OR u.nombre ILIKE $1 OR u.correo ILIKE $1)
        AND ($2 = '' OR p.estado = $2)
        AND ($3 = '' OR p.fecha_salida::date = NULLIF($3, '')::date)
      ORDER BY p.fecha_salida DESC, p.asiento LIMIT 300`, [patron, estado, fecha]);
  return rows;
}

export async function actualizar(db, id, d) {
  await db.query(
    `UPDATE compras_pasajes SET id_ruta = $2, fecha_salida = $3, hora_llegada = $4, asiento = $5, tipo_asiento = $6,
            equipaje_kg = $7, precio = $8 WHERE id = $1`,
    [id, d.idRuta, d.fechaSalida, d.horaLlegada, d.asiento, d.tipoAsiento, d.equipajeKg, d.precio]);
}

export async function cambiarEstado(db, id, estado) {
  await db.query(`UPDATE compras_pasajes SET estado = $2 WHERE id = $1`, [id, estado]);
}

export async function eliminar(db, id) {
  await db.query(`DELETE FROM estados_historial WHERE entidad = 'pasaje' AND id_entidad = $1`, [id]);
  await db.query(`DELETE FROM compras_pasajes WHERE id = $1`, [id]);
}
