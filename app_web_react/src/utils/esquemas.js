// src/utils/esquemas.js
// Reglas de los formularios con Zod (las mismas que valida la API; aquí se avisan antes, campo por campo)
import { z } from 'zod';

const correo = z.string().trim().min(1, 'Escribe tu correo.').email('El correo no es válido.');

export const esquemaLogin = z.object({
  correo,
  password: z.string().min(1, 'Escribe tu contraseña.'),
});

export const esquemaRegistro = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre completo.').max(80, 'Máximo 80 caracteres.'),
  correo,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmar: z.string(),
  dni: z.string().trim().regex(/^(\d{8})?$/, 'El DNI debe tener 8 dígitos.'),
  celular: z.string().trim().regex(/^(9\d{8})?$/, 'El celular debe tener 9 dígitos y empezar con 9.'),
}).refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden.' });

export const esquemaPlaca = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/, 'La placa debe tener el formato ABC-123.');

// Fuerza de la contraseña (0 a 4) para la barrita del registro
export function fuerzaClave(clave = '') {
  let puntos = 0;
  if (clave.length >= 6) puntos++;
  if (clave.length >= 10) puntos++;
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) puntos++;
  if (/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) puntos++;
  return puntos;
}
