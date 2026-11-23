// src/components/AnimacionLottie.jsx
// Reproduce una animación Lottie (versión liviana, solo SVG).
// Con "menos movimiento" se muestra quieta en su último cuadro.
import { LottieSvg } from 'lottie-react';
import { menosMovimiento } from '../utils/movimiento.js';

export default function AnimacionLottie({ datos, bucle = false, className = '', etiqueta }) {
  const quieta = menosMovimiento();
  return (
    <LottieSvg src={datos} autoplay loop={bucle && !quieta} segment={quieta ? [datos.op - 2, datos.op - 1] : undefined}
      className={`lottie ${className}`} role={etiqueta ? 'img' : undefined} aria-label={etiqueta} aria-hidden={etiqueta ? undefined : true} />
  );
}
