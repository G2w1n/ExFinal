// src/utils/asyncHandler.js
// Pasa los errores de las funciones async al errorHandler de Express
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
