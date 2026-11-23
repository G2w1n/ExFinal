// src/repositories/imagenes.repository.js
// Imágenes guardadas como BYTEA en la misma base (una por tipo y entidad)
import { pool } from '../config/db.js';

// Versión para el caché del navegador: cambia cada vez que se reemplaza la imagen
export const VERSION = (tipo, columna) =>
  `(SELECT (EXTRACT(EPOCH FROM i.actualizado) * 1000)::bigint FROM imagenes i WHERE i.tipo = '${tipo}' AND i.id_entidad = ${columna})`;

export async function obtener(tipo, id) {
  const { rows } = await pool.query(
    `SELECT mime, datos, (EXTRACT(EPOCH FROM actualizado) * 1000)::bigint AS version FROM imagenes WHERE tipo = $1 AND id_entidad = $2`, [tipo, id]);
  return rows[0] ?? null;
}

export async function guardar({ tipo, id, mime, datos, idAutor }) {
  const { rows } = await pool.query(
    `INSERT INTO imagenes (tipo, id_entidad, mime, datos, id_autor) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (tipo, id_entidad) DO UPDATE SET mime = EXCLUDED.mime, datos = EXCLUDED.datos, id_autor = EXCLUDED.id_autor, actualizado = NOW()
     RETURNING (EXTRACT(EPOCH FROM actualizado) * 1000)::bigint AS version, octet_length(datos) AS bytes`,
    [tipo, id, mime, datos, idAutor]);
  return rows[0];
}

export async function borrar(tipo, id) {
  const { rowCount } = await pool.query(`DELETE FROM imagenes WHERE tipo = $1 AND id_entidad = $2`, [tipo, id]);
  return rowCount > 0;
}
