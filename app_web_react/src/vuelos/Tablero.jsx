// src/vuelos/Tablero.jsx
// Tablero de salidas y llegadas estilo aeropuerto (letras que giran al cambiar), traído del Parcial.
// Se recalcula cada 30 segundos con la hora de Perú.
import { useEffect, useMemo, useState } from 'react';
import { AEROLINEAS, ahoraEnLima, aHora, filtrarVuelos, obtenerVuelos } from './datosVuelos.js';

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
            <tr><th>Hora</th><th>Vuelo</th><th>{tipo === 'salida' ? 'Destino' : 'Origen'}</th><th>Puerta</th><th>Estado</th></tr>
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
