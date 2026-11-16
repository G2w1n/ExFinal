// src/utils/AppError.js
// Error con código HTTP: el errorHandler lo convierte en { mensaje } con ese estado
export class AppError extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}
