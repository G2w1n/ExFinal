// src/components/BotonTema.jsx
import { useTema } from '../hooks/useTema.js';

export function BotonTema() {
  const [tema, alternar] = useTema();
  const oscuro = tema === 'oscuro';
  return (
    <button type="button" className="btn-icono" onClick={alternar} aria-pressed={oscuro} aria-label="Modo oscuro" title={oscuro ? 'Modo claro' : 'Modo oscuro'}>
      <span aria-hidden="true">{oscuro ? '☀' : '☾'}</span>
    </button>
  );
}
