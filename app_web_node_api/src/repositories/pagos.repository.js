// src/repositories/pagos.repository.js
import { pool } from '../config/db.js';
import { codigoOperacion } from '../utils/codigos.js';

export async function deEntidad(entidad, id) {
  const { rows } = await pool.query(
    `SELECT p.codigo_operacion, p.metodo, p.monto, p.fecha, c.nombre AS cajero
       FROM pagos p LEFT JOIN usuarios c ON c.id = p.id_cajero
      WHERE p.entidad = $1 AND p.id_entidad = $2`, [entidad, id]);
  return rows[0] ?? null;
}

export async function registrar(db, { entidad, idEntidad, idUsuario, metodo, monto, idCajero = null, recibido = null, vuelto = null }) {
  const { rows } = await db.query(
    `INSERT INTO pagos (codigo_operacion, entidad, id_entidad, id_usuario, metodo, monto, id_cajero, monto_recibido, vuelto)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING codigo_operacion, monto, metodo, fecha`,
    [codigoOperacion(), entidad, idEntidad, idUsuario, metodo, monto, idCajero, recibido, vuelto]);
  return rows[0];
}
