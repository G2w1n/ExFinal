// Preparación de las pruebas: matchers de Testing Library y "menos movimiento" para que
// las animaciones (contadores, Lottie) muestren su valor final al instante
import '@testing-library/jest-dom/vitest';

window.matchMedia = window.matchMedia || ((consulta) => ({
  matches: consulta.includes('prefers-reduced-motion'), media: consulta, onchange: null,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
}));
