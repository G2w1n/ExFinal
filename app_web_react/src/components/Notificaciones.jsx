// src/components/Notificaciones.jsx
// Campanita 🔔: se actualiza sola cada 30 segundos; avisa con un mensaje cuando llega algo nuevo
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificacionesApi } from '../api/servicios.api.js';
import { useAvisos } from '../context/AvisosContext.jsx';

const CLAVE = 'grupo15.notificacionesVistas';
const leerVistas = () => { try { return new Set(JSON.parse(localStorage.getItem(CLAVE)) ?? []); } catch { return new Set(); } };
const ICONOS = { llegada: '🚌', compra: '🎟', reserva: '🅿', viaje: '🚌', espacio: '✅', pendiente: '⏳' };

export function Notificaciones() {
  const avisar = useAvisos();
  const [lista, setLista] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [vistas, setVistas] = useState(leerVistas);
  const conocidas = useRef(null);
  const caja = useRef(null);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      if (document.hidden) return;
      try {
        const nuevas = await notificacionesApi.listar();
        if (!activo) return;
        // Avisa solo lo que apareció después de abrir la página
        if (conocidas.current) nuevas.filter((n) => !conocidas.current.has(n.texto)).slice(0, 2).forEach((n) => avisar(`${ICONOS[n.tipo] ?? '🔔'} ${n.texto}`));
        conocidas.current = new Set(nuevas.map((n) => n.texto));
        setLista(nuevas);
      } catch { /* sin conexión: se intenta en la próxima vuelta */ }
    };
    cargar();
    const t = setInterval(cargar, 30000);
    return () => { activo = false; clearInterval(t); };
  }, [avisar]);

  useEffect(() => {
    const cerrar = (e) => { if (!caja.current?.contains(e.target)) setAbierto(false); };
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, []);

  const sinVer = lista.filter((n) => !vistas.has(n.texto)).length;
  function alternar() {
    setAbierto(!abierto);
    if (!abierto) {
      const todas = new Set([...vistas, ...lista.map((n) => n.texto)]);
      setVistas(todas);
      try { localStorage.setItem(CLAVE, JSON.stringify([...todas].slice(-100))); } catch { /* sin almacenamiento */ }
    }
  }

  return (
    <div className="notificaciones" ref={caja}>
      <button type="button" className={`btn-icono ${sinVer ? 'con-novedad' : ''}`} aria-expanded={abierto} aria-label={`Notificaciones: ${sinVer} sin ver`} onClick={alternar}>
        <span aria-hidden="true">🔔</span>
        {sinVer > 0 && <span className="insignia">{sinVer}</span>}
      </button>
      {abierto && (
        <div className="notificaciones-panel">
          <p className="notif-titulo">Notificaciones</p>
          {lista.length === 0 ? <p className="vacio">Todo al día ✓</p> : (
            <ul>
              {lista.map((n) => (
                <li key={n.texto}><Link to={n.enlace} onClick={() => setAbierto(false)}><span aria-hidden="true">{ICONOS[n.tipo] ?? '🔔'}</span> {n.texto}</Link></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
