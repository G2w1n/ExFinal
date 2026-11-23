// src/utils/texto.js
// Búsqueda sin importar mayúsculas ni tildes: "comprobante" encuentra "Comprobante"
export const normalizar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
