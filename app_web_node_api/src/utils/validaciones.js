// src/utils/validaciones.js
import { AppError } from './AppError.js';

export const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PLACA = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;
export const FECHA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
export const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function texto(valor, nombre, { min = 1, max = 120 } = {}) {
  const t = String(valor ?? '').trim();
  if (t.length < min || t.length > max) throw new AppError(400, `${nombre}: escribe entre ${min} y ${max} caracteres.`);
  return t;
}

export function numero(valor, nombre, { min = -Infinity, max = Infinity, entero = false } = {}) {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max || (entero && !Number.isInteger(n))) {
    throw new AppError(400, `${nombre} no es válido.`);
  }
  return n;
}

export function placa(valor) {
  const p = String(valor ?? '').trim().toUpperCase();
  if (!PLACA.test(p)) throw new AppError(400, 'La placa debe tener el formato ABC-123.');
  return p;
}

// "2026-11-08T15:30" -> "2026-11-08 15:30:00"
export function fechaHora(valor, nombre = 'La fecha') {
  const t = String(valor ?? '').trim();
  if (!FECHA_HORA.test(t)) throw new AppError(400, `${nombre} no es válida.`);
  return `${t.slice(0, 10)} ${t.slice(11, 16)}:00`;
}

export function idParam(valor) {
  return numero(valor, 'El identificador', { min: 1, entero: true });
}
