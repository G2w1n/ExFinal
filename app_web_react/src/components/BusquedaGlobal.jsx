// src/components/BusquedaGlobal.jsx
// Búsqueda global del personal (Ctrl + K): placa, código o nombre en pasajes, reservas y clientes
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crmApi, pasajesApi, reservasApi } from '../api/servicios.api.js';
import { useAuth } from '../context/AuthContext.jsx';

export function BusquedaGlobal() {
  const { tiene } = useAuth();
  const navegar = useNavigate();
  const dialogo = useRef(null);
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState([]);
  const [elegido, setElegido] = useState(0);
  const ta = tiene('transandino', 'administrador', 'empleado');
  const aero = tiene('aeropuerto', 'administrador', 'empleado');

  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!dialogo.current.open) dialogo.current.showModal();
      }
    };
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, []);

  useEffect(() => {
    if (texto.trim().length < 2) { setResultados([]); return undefined; }
    const t = setTimeout(async () => {
      const [p, r, c] = await Promise.all([
        ta ? pasajesApi.listar({ buscar: texto }).catch(() => []) : [],
        aero ? reservasApi.listar({ buscar: texto }).catch(() => []) : [],
        crmApi.clientes({ buscar: texto }).catch(() => []),
      ]);
      setElegido(0);
      setResultados([
        ...p.slice(0, 4).map((x) => ({ tipo: 'Pasaje', titulo: `${x.codigo} · ${x.origen} → ${x.destino}`, detalle: `${x.cliente} · ${x.estado}`, ruta: `/app/transandino/panel?buscar=${x.codigo}` })),
        ...r.slice(0, 4).map((x) => ({ tipo: 'Reserva', titulo: `${x.codigo} · ${x.placa}`, detalle: `${x.cliente} · ${x.estado}`, ruta: `/app/aeropuerto/panel?buscar=${x.codigo}` })),
        ...c.slice(0, 4).map((x) => ({ tipo: 'Cliente', titulo: x.nombre, detalle: `${x.correo} · ${x.segmento}`, ruta: `/app/crm/clientes/${x.id}` })),
      ]);
    }, 250);
    return () => clearTimeout(t);
  }, [texto, ta, aero]);

  function ir(r) {
    dialogo.current.close();
    setTexto('');
    navegar(r.ruta);
  }
  function teclas(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setElegido((i) => Math.min(i + 1, resultados.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setElegido((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && resultados[elegido]) { e.preventDefault(); ir(resultados[elegido]); }
  }

  return (
    <>
      <button type="button" className="btn-buscar" onClick={() => dialogo.current.showModal()}>
        <span aria-hidden="true">⌕</span> Buscar <kbd>Ctrl</kbd><kbd>K</kbd>
      </button>
      <dialog ref={dialogo} className="dialogo dialogo-busqueda" aria-label="Búsqueda global">
        <div className="busqueda-caja">
          <input autoFocus type="search" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={teclas}
            placeholder="Placa, código (PAS-, EST-) o nombre del cliente" aria-label="Buscar" />
          {texto.trim().length >= 2 && resultados.length === 0 && <p className="vacio">Sin resultados.</p>}
          <ul role="listbox" aria-label="Resultados">
            {resultados.map((r, i) => (
              <li key={`${r.tipo}-${r.titulo}`} role="option" aria-selected={i === elegido}>
                <button type="button" onClick={() => ir(r)} onMouseEnter={() => setElegido(i)}>
                  <span className={`res-tipo tipo-${r.tipo.toLowerCase()}`}>{r.tipo}</span>
                  <strong>{r.titulo}</strong><small>{r.detalle}</small>
                </button>
              </li>
            ))}
          </ul>
          <p className="nota">↑ ↓ para moverte · Enter para abrir · Esc para cerrar</p>
        </div>
      </dialog>
    </>
  );
}
