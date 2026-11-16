// src/services/auth.service.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { enTransaccion } from '../config/db.js';
import * as usuarios from '../repositories/usuarios.repository.js';
import { AppError } from '../utils/AppError.js';
import { CORREO, texto } from '../utils/validaciones.js';

const publico = (u) => ({ id: u.id, nombre: u.nombre, correo: u.correo, roles: u.roles });

function firmar(u) {
  // El token lleva el id y los roles: el menú de React y la API los leen de aquí
  return jwt.sign({ id: u.id, nombre: u.nombre, correo: u.correo, roles: u.roles }, process.env.JWT_SECRET, { expiresIn: '8h' });
}

export async function login({ correo, password }) {
  const c = String(correo ?? '').trim().toLowerCase();
  const u = await usuarios.buscarPorCorreo(c);
  // Mismo mensaje si no existe o si la clave está mal: no se revela qué correos existen
  if (!u || !u.activo || !(await bcrypt.compare(String(password ?? ''), u.password_hash))) {
    throw new AppError(401, 'Correo o contraseña incorrectos.');
  }
  return { token: firmar(u), usuario: publico(u) };
}

export async function registrar({ nombre, correo, password, dni, celular }) {
  const datos = {
    nombre: texto(nombre, 'Nombre', { min: 2, max: 80 }),
    correo: String(correo ?? '').trim().toLowerCase(),
    dni: dni ? String(dni).trim() : null,
    celular: celular ? String(celular).trim() : null,
  };
  if (!CORREO.test(datos.correo)) throw new AppError(400, 'El correo no es válido.');
  if (String(password ?? '').length < 6) throw new AppError(400, 'La contraseña debe tener al menos 6 caracteres.');
  if (datos.dni && !/^\d{8}$/.test(datos.dni)) throw new AppError(400, 'El DNI debe tener 8 dígitos.');
  if (datos.celular && !/^9\d{8}$/.test(datos.celular)) throw new AppError(400, 'El celular debe tener 9 dígitos y empezar con 9.');
  if (await usuarios.buscarPorCorreo(datos.correo)) throw new AppError(409, 'Ya existe una cuenta con ese correo.');

  const passwordHash = await bcrypt.hash(String(password), 10);
  await enTransaccion((db) => usuarios.crearCliente(db, { ...datos, passwordHash }));
  return login({ correo: datos.correo, password });
}

export async function perfil(id) {
  const u = await usuarios.buscarPorId(id);
  if (!u) throw new AppError(404, 'La cuenta no existe.');
  return u;
}
