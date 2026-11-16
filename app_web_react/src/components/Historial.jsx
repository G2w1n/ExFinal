// src/components/Historial.jsx
// Trazabilidad: cada cambio de estado con quién y cuándo
import { momento } from '../utils/formato.js';
import { Estado } from './Estado.jsx';

export function Historial({ pasos, conCodigo = false }) {
  if (!pasos?.length) return <p className="vacio">Sin movimientos todavía.</p>;
  return (
    <ol className="linea-tiempo">
      {pasos.map((p, i) => (
        <li key={`${p.fecha}-${i}`}>
          <span className="punto" aria-hidden="true" />
          <div>
            <p>{conCodigo && <strong>{p.codigo} · </strong>}<Estado valor={p.estado} /> {p.nota}</p>
            <p className="quien">{p.usuario ?? 'Sistema'} · {momento(p.fecha)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
