// src/utils/codigos.js
// Códigos legibles a partir del id: PAS-00030, EST-00019
export const codigoDe = (prefijo, id) => `${prefijo}-${String(id).padStart(5, '0')}`;

export const codigoOperacion = () =>
  `OP-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
