// src/repositories/pagos.repository.js
import { codigoOperacion } from '../utils/codigos.js';

export async function registrar(db, { entidad, idEntidad, idUsuario, metodo, monto }) {
  const { rows } = await db.query(
    `INSERT INTO pagos (codigo_operacion, entidad, id_entidad, id_usuario, metodo, monto)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING codigo_operacion, monto, metodo, fecha`,
    [codigoOperacion(), entidad, idEntidad, idUsuario, metodo, monto]);
  return rows[0];
}
