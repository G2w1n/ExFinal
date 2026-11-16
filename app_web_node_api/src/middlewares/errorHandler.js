// src/middlewares/errorHandler.js
// Todas las respuestas de error tienen la forma { mensaje }
import { AppError } from '../utils/AppError.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) return res.status(err.estado).json({ mensaje: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El cuerpo de la petición no es JSON válido.' });
  // Restricciones de la base de datos
  if (err.code === '23505') return res.status(409).json({ mensaje: 'Ese registro ya existe (por ejemplo, el asiento ya está vendido).' });
  if (err.code === '23514' || err.code === '22P02' || err.code === '22007' || err.code === '22008') {
    return res.status(400).json({ mensaje: 'Algún dato no es válido.' });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Ocurrió un error en el servidor. Intenta de nuevo.' });
}
