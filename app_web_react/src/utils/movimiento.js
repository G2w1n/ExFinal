// src/utils/movimiento.js
// ¿El sistema pide menos movimiento? Entonces las animaciones se saltan (accesibilidad)
export const menosMovimiento = () => typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
