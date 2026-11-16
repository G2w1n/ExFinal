// src/repositories/historial.repository.js
// Trazabilidad: cada cambio de estado queda con quién (usuario_id) y cuándo (fecha)
import { pool } from '../config/db.js';

export async function registrar(db, { entidad, id, estado, usuarioId = null, nota = null }) {
  await db.query(
    `INSERT INTO estados_historial (entidad, id_entidad, estado, usuario_id, nota) VALUES ($1, $2, $3, $4, $5)`,
    [entidad, id, estado, usuarioId, nota]);
}

export async function deEntidad(entidad, id) {
  const { rows } = await pool.query(
    `SELECT h.estado, h.nota, h.fecha, u.nombre AS usuario
       FROM estados_historial h LEFT JOIN usuarios u ON u.id = h.usuario_id
      WHERE h.entidad = $1 AND h.id_entidad = $2 ORDER BY h.fecha, h.id`, [entidad, id]);
  return rows;
}
