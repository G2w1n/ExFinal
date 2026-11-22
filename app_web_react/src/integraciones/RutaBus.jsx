// src/integraciones/RutaBus.jsx
// El bus avanza por la ruta según la hora real del viaje; al llegar, la "P" del estacionamiento se enciende
import { useEffect, useState } from 'react';
import { dentroDe, hora } from '../utils/formato.js';

const minutos = (texto) => new Date(`${String(texto).slice(0, 16).replace(' ', 'T')}:00Z`).getTime() / 60000;

function falta(min) {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = Math.round(min % 60);
  return d ? `${d} d ${h} h` : h ? `${h} h ${m} min` : `${m} min`;
}

export function RutaBus({ pasaje, conEstacionamiento }) {
  const [ahora, setAhora] = useState(() => minutos(dentroDe(0)));
  useEffect(() => { const t = setInterval(() => setAhora(minutos(dentroDe(0))), 30000); return () => clearInterval(t); }, []);
  const salida = minutos(pasaje.fecha_salida);
  const llegada = minutos(pasaje.hora_llegada);
  const avance = Math.max(0, Math.min(1, (ahora - salida) / (llegada - salida)));
  const estado = pasaje.estado === 'cancelado' ? 'Cancelado'
    : ahora < salida ? `Sale en ${falta(salida - ahora)}`
      : ahora < llegada ? `En camino · llega en ${falta(llegada - ahora)}` : 'Llegó a destino';
  const enCamino = ahora >= salida && ahora < llegada && pasaje.estado !== 'cancelado';

  return (
    <div className={`ruta-bus ${enCamino ? 'en-camino' : ''} ${avance >= 1 ? 'llego' : ''}`}>
      <div className="ruta-linea" role="img" aria-label={`${pasaje.origen} a ${pasaje.destino}: ${estado}`}>
        <span className="ruta-hecha" style={{ width: `${avance * 100}%` }} />
        <span className="ruta-bus-icono" style={{ left: `${avance * 100}%` }} aria-hidden="true">🚌</span>
        <span className={`ruta-p ${conEstacionamiento ? 'con-reserva' : ''}`} aria-hidden="true">P</span>
      </div>
      <div className="ruta-extremos">
        <span>{pasaje.origen} · {hora(pasaje.fecha_salida)}</span>
        <strong>{estado}</strong>
        <span>{pasaje.destino} · {hora(pasaje.hora_llegada)}</span>
      </div>
    </div>
  );
}
