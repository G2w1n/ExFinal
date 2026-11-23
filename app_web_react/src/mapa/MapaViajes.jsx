// src/mapa/MapaViajes.jsx
// Mapa real del Perú (Leaflet + OpenStreetMap): el recorrido de cada bus, el bus en su posición
// según la hora y el Aeropuerto Internacional del Cusco. Se actualiza cada 30 segundos.
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { dentroDe, hora } from '../utils/formato.js';
import { AEROPUERTO, avance, camino, puntoEn } from './rutas.js';

const icono = (html, clase) => L.divIcon({ html, className: `marcador ${clase}`, iconSize: [34, 34], iconAnchor: [17, 17] });
const ICONO_AEROPUERTO = icono('<span>✈</span>', 'marcador-aeropuerto');

function Encuadre({ puntos }) {
  const mapa = useMap();
  useEffect(() => { if (puntos.length) mapa.fitBounds(puntos, { padding: [30, 30] }); }, [mapa, puntos]);
  return null;
}

export default function MapaViajes({ viajes, alto = 320 }) {
  const [ahora, setAhora] = useState(() => dentroDe(0));
  useEffect(() => { const t = setInterval(() => setAhora(dentroDe(0)), 30000); return () => clearInterval(t); }, []);

  const trazos = useMemo(() => viajes.map((v) => {
    const puntos = camino(v.origen, v.destino);
    const fraccion = avance(v.fecha_salida, v.hora_llegada, ahora);
    return { ...v, puntos, fraccion, posicion: puntoEn(puntos, fraccion) };
  }), [viajes, ahora]);
  const todos = useMemo(() => [...trazos.flatMap((t) => t.puntos), AEROPUERTO], [trazos]);

  return (
    <div className="mapa-viajes" style={{ height: alto }}>
      <MapContainer center={AEROPUERTO} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} attributionControl>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
        <Encuadre puntos={todos} />
        {trazos.map((t) => (
          <Polyline key={`r-${t.codigo}`} positions={t.puntos} pathOptions={{ color: '#1f6b44', weight: 4, opacity: 0.35, dashArray: '6 8' }} />
        ))}
        {trazos.map((t) => (
          <Polyline key={`h-${t.codigo}`} positions={[...t.puntos.slice(0, 1), ...t.puntos.filter((_, i) => i / (t.puntos.length - 1) <= t.fraccion), t.posicion]}
            pathOptions={{ color: '#1f6b44', weight: 5 }} />
        ))}
        {trazos.map((t) => (
          <Marker key={`b-${t.codigo}`} position={t.posicion} icon={icono('<span>🚌</span>', t.fraccion > 0 && t.fraccion < 1 ? 'marcador-bus en-ruta' : 'marcador-bus')}>
            <Tooltip direction="top" offset={[0, -14]}>
              <strong>{t.codigo}</strong> · {t.origen} → {t.destino}<br />
              {t.fraccion <= 0 ? `Sale ${hora(t.fecha_salida)}` : t.fraccion >= 1 ? 'Llegó' : `En camino · ${Math.round(t.fraccion * 100)} %`} · llega {hora(t.hora_llegada)}
              {t.placa && <><br />Estacionamiento: {t.placa}</>}
            </Tooltip>
          </Marker>
        ))}
        <Marker position={AEROPUERTO} icon={ICONO_AEROPUERTO}>
          <Tooltip direction="top" offset={[0, -14]}>Aeropuerto Internacional del Cusco · estacionamiento</Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
