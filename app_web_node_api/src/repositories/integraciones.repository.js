// src/repositories/integraciones.repository.js
// Consultas que cruzan las dos apps (JOIN compras_pasajes ↔ reservas_estacionamiento)
import { pool } from '../config/db.js';

// Integración 1: «Mis viajes» = pasajes del usuario con su reserva enlazada, más reservas sin pasaje
export async function misViajes(idUsuario) {
  const { rows: pasajes } = await pool.query(
    `SELECT p.id, p.codigo, p.estado, p.fecha_salida, p.hora_llegada, p.asiento, p.precio, r.origen, r.destino,
            e.id AS reserva_id, e.codigo AS reserva_codigo, e.estado AS reserva_estado, e.placa, e.fecha_hora_entrada, e.monto AS reserva_monto
       FROM compras_pasajes p
       JOIN rutas r ON r.id = p.id_ruta
       LEFT JOIN reservas_estacionamiento e ON e.id_pasaje = p.id AND e.estado <> 'cancelado'
      WHERE p.id_usuario = $1 ORDER BY p.fecha_salida DESC`, [idUsuario]);
  const { rows: sueltas } = await pool.query(
    `SELECT id, codigo, estado, placa, fecha_hora_entrada, horas, monto, tipo, zona FROM reservas_estacionamiento
      WHERE id_usuario = $1 AND id_pasaje IS NULL ORDER BY fecha_hora_entrada DESC`, [idUsuario]);
  return { pasajes, reservasSinPasaje: sueltas };
}

// Integración 3: llegadas esperadas, ordenadas por la hora de llegada del bus
export async function llegadas(fecha) {
  const { rows } = await pool.query(
    `SELECT e.id, e.codigo, e.placa, e.estado, e.zona_vip, e.fecha_hora_entrada, e.horas, u.nombre AS cliente,
            p.codigo AS pasaje_codigo, p.hora_llegada, r.origen, p.estado AS pasaje_estado
       FROM reservas_estacionamiento e
       JOIN compras_pasajes p ON p.id = e.id_pasaje
       JOIN rutas r ON r.id = p.id_ruta
       JOIN usuarios u ON u.id = e.id_usuario
      WHERE p.hora_llegada::date = $1::date AND e.estado <> 'cancelado'
      ORDER BY p.hora_llegada, e.codigo`, [fecha]);
  return rows;
}

export async function busesDe(idUsuario) {
  const { rows } = await pool.query(
    `SELECT id, codigo, placa, estado, zona, fecha_hora_entrada, horas, monto FROM reservas_estacionamiento
      WHERE id_usuario = $1 AND tipo = 'bus' ORDER BY fecha_hora_entrada DESC`, [idUsuario]);
  return rows;
}
