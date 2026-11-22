// src/components/Desglose.jsx
// Detalle del precio que calcula el servidor (nunca se confía en el total del navegador)
import { soles } from '../utils/formato.js';
import { Numero } from './Numero.jsx';

export function Desglose({ cotizacion, titulo = 'Total' }) {
  if (!cotizacion) return null;
  return (
    <div className="desglose" aria-live="polite">
      <ul>
        {cotizacion.lineas.map((l) => (
          <li key={l.etiqueta}><span>{l.etiqueta}</span><span>{soles(l.valor)}</span></li>
        ))}
      </ul>
      {cotizacion.nota && <p className="nota">{cotizacion.nota}</p>}
      <p className="total"><span>{titulo}</span><strong><Numero valor={cotizacion.total} formato={soles} duracion={500} /></strong></p>
    </div>
  );
}
