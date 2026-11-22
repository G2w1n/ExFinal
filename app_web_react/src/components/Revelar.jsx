// src/components/Revelar.jsx
// Aparece suavemente cuando entra en pantalla al bajar (scroll reveal)
import { useEffect, useRef, useState } from 'react';
import { menosMovimiento } from '../utils/movimiento.js';

export function Revelar({ as: Etiqueta = 'div', className = '', retraso = 0, children, ...resto }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(menosMovimiento());
  useEffect(() => {
    if (visible || !('IntersectionObserver' in window)) { setVisible(true); return undefined; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible]);
  return (
    <Etiqueta ref={ref} className={`revelar ${visible ? 'visible' : ''} ${className}`} style={{ transitionDelay: `${retraso}ms` }} {...resto}>
      {children}
    </Etiqueta>
  );
}
