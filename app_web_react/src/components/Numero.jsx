// src/components/Numero.jsx
// Número que sube contando (0 → valor) cuando aparece o cuando cambia
import { useEffect, useRef, useState } from 'react';
import { menosMovimiento } from '../utils/movimiento.js';

export function Numero({ valor, formato = (n) => String(Math.round(n)), duracion = 900 }) {
  const destino = Number(valor) || 0;
  const [actual, setActual] = useState(menosMovimiento() ? destino : 0);
  const desde = useRef(actual);

  useEffect(() => {
    if (menosMovimiento()) { setActual(destino); return undefined; }
    const inicio = performance.now();
    const origen = desde.current;
    let cuadro;
    const paso = (t) => {
      const avance = Math.min(1, (t - inicio) / duracion);
      const suave = 1 - (1 - avance) ** 3;
      const valorAhora = origen + (destino - origen) * suave;
      setActual(valorAhora);
      desde.current = valorAhora;
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [destino, duracion]);

  return <span className="numero">{formato(actual)}</span>;
}
