// src/repositories/reservas.repository.js
import { pool } from '../config/db.js';
import { codigoDe } from '../utils/codigos.js';

const SELECT_RESERVA = `
  SELECT e.*, u.nombre AS cliente, u.correo AS correo_cliente,
         p.codigo AS pasaje_codigo, p.hora_llegada AS pasaje_llegada, r.origen AS pasaje_origen
    FROM reservas_estacionamiento e
    JOIN usuarios u ON u.id = e.id_usuario
    LEFT JOIN compras_pasajes p ON p.id = e.id_pasaje
    LEFT JOIN rutas r ON r.id = p.id_ruta`;

export async function crear(db, d) {
  const { rows: [{ id }] } = await db.query(`SELECT nextval(pg_get_serial_sequence('reservas_estacionamiento', 'id'))::int AS id`);
  await db.query(
    `INSERT INTO reservas_estacionamiento (id, codigo, id_usuario, id_pasaje, tipo, placa, nombre_pasajero, fecha_hora_entrada, horas, zona_vip, monto)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [id, codigoDe('EST', id), d.idUsuario, d.idPasaje ?? null, d.tipo, d.placa, d.nombrePasajero, d.entrada, d.horas, d.zonaVip, d.monto]);
  return id;
}

export async function porId(id, db = pool, bloquear = false) {
  const { rows } = await db.query(bloquear
    ? `SELECT * FROM reservas_estacionamiento WHERE id = $1 FOR UPDATE`
    : `${SELECT_RESERVA} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function deUsuario(idUsuario) {
  const { rows } = await pool.query(`${SELECT_RESERVA} WHERE e.id_usuario = $1 ORDER BY e.fecha_hora_entrada DESC`, [idUsuario]);
  return rows;
}

export async function listar({ buscar = '', estado = '', tipo = '', fecha = '' }) {
  const patron = `%${buscar.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await pool.query(
    `${SELECT_RESERVA}
      WHERE ($1 = '%%' OR e.codigo ILIKE $1 OR e.placa ILIKE $1 OR u.nombre ILIKE $1 OR e.nombre_pasajero ILIKE $1)
        AND ($2 = '' OR e.estado = $2)
        AND ($3 = '' OR e.tipo = $3)
        AND ($4 = '' OR e.fecha_hora_entrada::date = NULLIF($4, '')::date)
      ORDER BY e.fecha_hora_entrada DESC LIMIT 300`, [patron, estado, tipo, fecha]);
  return rows;
}

export async function actualizar(db, id, d) {
  await db.query(
    `UPDATE reservas_estacionamiento SET placa = $2, nombre_pasajero = $3, fecha_hora_entrada = $4, horas = $5, zona_vip = $6, monto = $7
      WHERE id = $1`, [id, d.placa, d.nombrePasajero, d.entrada, d.horas, d.zonaVip, d.monto]);
}

export async function cambiarEstado(db, id, estado) {
  await db.query(`UPDATE reservas_estacionamiento SET estado = $2 WHERE id = $1`, [id, estado]);
}

export async function asignarZona(db, id, zona) {
  await db.query(`UPDATE reservas_estacionamiento SET zona = $2 WHERE id = $1`, [id, zona]);
}

export async function eliminar(db, id) {
  await db.query(`DELETE FROM estados_historial WHERE entidad = 'reserva' AND id_entidad = $1`, [id]);
  await db.query(`DELETE FROM reservas_estacionamiento WHERE id = $1`, [id]);
}
