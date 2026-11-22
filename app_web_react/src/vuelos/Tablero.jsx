// src/vuelos/Tablero.jsx
// Tablero de salidas y llegadas estilo aeropuerto (letras que giran al cambiar), traído del Parcial.
// Se recalcula cada 30 segundos con la hora de Perú.
import { useEffect, useMemo, useState } from 'react';
import { AEROLINEAS, ahoraEnLima, aHora, filtrarVuelos, obtenerVuelos } from './datosVuelos.js';
import { useAvisos } from '../context/AvisosContext.jsx';

// Vuelos seguidos (☆): se guardan en este navegador con lo último que vio el pasajero
const CLAVE = 'grupo15.vuelosSeguidos';
const leerSeguidos = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) ?? {}; } catch { return {}; } };
const guardarSeguidos = (s) => { try { localStorage.setItem(CLAVE, JSON.stringify(s)); } catch { /* sin almacenamiento */ } };
const foto = (v) => ({ estado: v.estado.texto, puerta: v.puerta, hora: v.horaEstimada });
function cuenta(min, tipo) {
  if (min <= 0) return tipo === 'salida' ? 'ya salió' : 'ya llegó';
  const h = Math.floor(min / 60);
  return h ? `en ${h} h ${min % 60} min` : `en ${min} min`;
}

// Cada letra gira al aparecer; key={texto} la vuelve a animar cuando cambia el valor
function Paleta({ texto, ancho }) {
  const letras = String(texto).toUpperCase().padEnd(ancho, ' ').slice(0, Math.max(ancho, String(texto).length)).split('');
  return (
    <span className="paleta" key={texto} aria-hidden="true">
      {letras.map((l, i) => <span key={i} className="letra" style={{ animationDelay: `${i * 35}ms` }}>{l === ' ' ? ' ' : l}</span>)}
    </span>
  );
}

export function Tablero({ compacto = false, limite = 0 }) {
  const [vuelos, setVuelos] = useState(() => obtenerVuelos());
  const [tipo, setTipo] = useState('salida');
  const [texto, setTexto] = useState('');
  const [aerolinea, setAerolinea] = useState('');
  const [reloj, setReloj] = useState(() => aHora(ahoraEnLima().minutos));
  const [seguidos, setSeguidos] = useState(leerSeguidos);
  const avisar = useAvisos();

  function alternarSeguir(v) {
    const nuevos = { ...seguidos };
    if (nuevos[v.id]) { delete nuevos[v.id]; avisar(`Dejaste de seguir ${v.codigo}.`); }
    else { nuevos[v.id] = foto(v); avisar(`Siguiendo ${v.codigo}: te avisamos si cambia su estado o su puerta.`); }
    setSeguidos(nuevos);
    guardarSeguidos(nuevos);
  }

  // Cada vez que se recalcula el tablero, compara los vuelos seguidos con lo último que se vio
  useEffect(() => {
    let cambio = false;
    const nuevos = { ...seguidos };
    vuelos.forEach((v) => {
      const antes = seguidos[v.id];
      if (!antes) return;
      const ahora = foto(v);
      if (antes.puerta !== ahora.puerta) avisar(`✈ ${v.codigo}: cambio de puerta a ${ahora.puerta}`);
      else if (antes.estado !== ahora.estado) avisar(`✈ ${v.codigo}: ${ahora.estado}`);
      if (antes.puerta !== ahora.puerta || antes.estado !== ahora.estado || antes.hora !== ahora.hora) { nuevos[v.id] = ahora; cambio = true; }
    });
    if (cambio) { setSeguidos(nuevos); guardarSeguidos(nuevos); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vuelos]);
  const misVuelos = vuelos.filter((v) => seguidos[v.id]);
  const ahoraMin = ahoraEnLima().minutos;

  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      setVuelos(obtenerVuelos());
      setReloj(aHora(ahoraEnLima().minutos));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const lista = useMemo(() => {
    const filtrados = filtrarVuelos(vuelos, { texto, aerolinea, tipo });
    return limite ? filtrados.slice(0, limite) : filtrados;
  }, [vuelos, texto, aerolinea, tipo, limite]);

  return (
    <section className={`tablero ${compacto ? 'tablero-compacto' : ''}`} aria-labelledby="t-tablero">
      <div className="tablero-cabecera">
        <div>
          <h2 id="t-tablero" className="tablero-titulo">{tipo === 'salida' ? 'Salidas' : 'Llegadas'} · Aeropuerto Cusco</h2>
          <p className="tablero-reloj">Hora de Cusco <time>{reloj}</time> · se actualiza solo</p>
        </div>
        <div className="tablero-pestanas" role="tablist" aria-label="Tipo de vuelo">
          {[['salida', 'Salidas'], ['llegada', 'Llegadas']].map(([valor, nombre]) => (
            <button key={valor} type="button" role="tab" aria-selected={tipo === valor} onClick={() => setTipo(valor)}>{nombre}</button>
          ))}
        </div>
      </div>
      {misVuelos.length > 0 && (
        <div className="mis-vuelos" aria-label="Vuelos que sigues">
          {misVuelos.map((v) => (
            <div key={v.id} className="mi-vuelo">
              <strong>{v.codigo}</strong> {v.tipo === 'salida' ? '→' : '←'} {v.ciudad}
              <span className={`estado-vuelo ev-${v.estado.clave}`}>{v.estado.texto}</span>
              <span className="mi-vuelo-cuenta">{v.minutosEstimados - ahoraMin > 0 ? `${v.tipo === 'salida' ? 'Sale' : 'Llega'} ${cuenta(v.minutosEstimados - ahoraMin, v.tipo)}` : cuenta(0, v.tipo)} · puerta {v.puerta}</span>
            </div>
          ))}
        </div>
      )}
      {!compacto && (
        <div className="tablero-filtros">
          <label className="visualmente-oculto" htmlFor="buscar-vuelo">Buscar vuelo</label>
          <input id="buscar-vuelo" type="search" placeholder="Vuelo, aerolínea o ciudad (ej. LA2021, Lima)" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <label className="visualmente-oculto" htmlFor="filtro-aerolinea">Aerolínea</label>
          <select id="filtro-aerolinea" value={aerolinea} onChange={(e) => setAerolinea(e.target.value)}>
            <option value="">Todas las aerolíneas</option>
            {Object.entries(AEROLINEAS).map(([codigo, a]) => <option key={codigo} value={codigo}>{a.nombre}</option>)}
          </select>
        </div>
      )}
      <div className="tablero-scroll">
        <table className="tabla-tablero">
          <caption className="visualmente-oculto">{tipo === 'salida' ? 'Salidas' : 'Llegadas'} del día</caption>
          <thead>
            <tr><th>Hora</th><th>Vuelo</th><th>{tipo === 'salida' ? 'Destino' : 'Origen'}</th><th>Puerta</th><th>Estado</th><th><span className="visualmente-oculto">Seguir</span></th></tr>
          </thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.id} className={`vuelo-${v.estado.clave}`}>
                <td>
                  <Paleta texto={v.horaEstimada} ancho={5} />
                  <span className="visualmente-oculto">{v.horaEstimada}</span>
                  {v.horaEstimada !== v.hora && <small className="hora-original">antes {v.hora}</small>}
                </td>
                <td>
                  <span className="aerolinea-punto" style={{ background: AEROLINEAS[v.aerolinea].color }} aria-hidden="true" />
                  <Paleta texto={v.codigo} ancho={7} /><span className="visualmente-oculto">{v.codigo} {v.nombreAerolinea}</span>
                </td>
                <td><Paleta texto={v.ciudad} ancho={compacto ? 10 : 16} /><span className="visualmente-oculto">{v.ciudad}{v.manana ? ' (mañana)' : ''}</span></td>
                <td className={v.puertaCambiada ? 'puerta-cambiada' : undefined}>
                  <Paleta texto={v.puerta} ancho={2} /><span className="visualmente-oculto">Puerta {v.puerta}{v.puertaCambiada ? ', cambió' : ''}</span>
                </td>
                <td><span className={`estado-vuelo ev-${v.estado.clave}`}>{v.estado.texto}</span></td>
                <td>
                  <button type="button" className={`btn-seguir ${seguidos[v.id] ? 'siguiendo' : ''}`} aria-pressed={Boolean(seguidos[v.id])}
                    aria-label={`${seguidos[v.id] ? 'Dejar de seguir' : 'Seguir'} el vuelo ${v.codigo}`} onClick={() => alternarSeguir(v)}>
                    {seguidos[v.id] ? '★' : '☆'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lista.length === 0 && <p className="tablero-vacio">No hay vuelos con esa búsqueda.</p>}
      </div>
      <p className="tablero-nota">Vuelos simulados para el caso académico: el estado cambia con la hora de Cusco.</p>
    </section>
  );
}
