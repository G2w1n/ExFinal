// src/middlewares/auth.js
// Lee el token "Authorization: Bearer ..." y deja al usuario en req.usuario. Sin token válido: 401
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export function auth(req, _res, next) {
  const [tipo, token] = String(req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) return next(new AppError(401, 'Inicia sesión para continuar.'));
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError(401, 'Tu sesión venció. Inicia sesión de nuevo.'));
  }
}
