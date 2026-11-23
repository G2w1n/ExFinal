// src/components/Animacion.jsx
// Las animaciones Lottie se cargan aparte (solo cuando se muestran), para que la página cargue rápido
import { lazy, Suspense } from 'react';
import check from '../animaciones/check.json';
import avion from '../animaciones/avion.json';

const AnimacionLottie = lazy(() => import('./AnimacionLottie.jsx'));
const ANIMACIONES = { check, avion };

export function Animacion({ nombre, ...props }) {
  return (
    <Suspense fallback={<div className={`lottie ${props.className ?? ''}`} aria-hidden="true" />}>
      <AnimacionLottie datos={ANIMACIONES[nombre]} {...props} />
    </Suspense>
  );
}
