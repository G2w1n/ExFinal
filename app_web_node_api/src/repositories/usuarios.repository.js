// src/repositories/usuarios.repository.js
// Solo SQL (siempre con parámetros $1, $2…): nada de reglas de negocio aquí
import { pool } from '../config/db.js';

// Roles como objeto: { transandino: 'cliente', aeropuerto: 'administrador' }
const ROLES = `COALESCE((SELECT json_object_agg(r.modulo, r.rol) FROM usuario_rol r WHERE r.id_usuario = u.id), '{}'::json) AS roles`;

export async function buscarPorCorreo(correo) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.password_hash, u.activo, ${ROLES} FROM usuarios u WHERE u.correo = $1`, [correo]);
  return rows[0] ?? null;
}

export async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.correo, u.dni, u.celular, u.activo, u.creado, ${ROLES} FROM usuarios u WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

// Cuenta nueva: es cliente en las dos apps
export async function crearCliente(db, { nombre, correo, passwordHash, dni, celular }) {
  const { rows } = await db.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, dni, celular) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [nombre, correo, passwordHash, dni, celular]);
  const id = rows[0].id;
  await db.query(`INSERT INTO usuario_rol (id_usuario, modulo, rol) VALUES ($1, 'transandino', 'cliente'), ($1, 'aeropuerto', 'cliente')`, [id]);
  return id;
}
