// src/middlewares/requireRol.js
// Seguridad por rol: aunque llamen a la API directo, sin el rol del módulo responde 403
import { AppError } from '../utils/AppError.js';

export const tieneRol = (usuario, modulo, ...roles) => roles.includes(usuario?.roles?.[modulo]);

// requireRol('aeropuerto', 'administrador', 'empleado')
export const requireRol = (modulo, ...roles) => (req, _res, next) =>
  tieneRol(req.usuario, modulo, ...roles) ? next() : next(new AppError(403, 'No tienes permiso para esta opción.'));

// Personal de cualquiera de las dos apps (para el CRM)
export const esPersonal = (usuario) => ['transandino', 'aeropuerto']
  .some((m) => tieneRol(usuario, m, 'administrador', 'empleado'));

export const requirePersonal = (req, _res, next) =>
  esPersonal(req.usuario) ? next() : next(new AppError(403, 'Esta opción es solo para el personal.'));
