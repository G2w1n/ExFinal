// src/components/FotoDestino.jsx
// Banner de la ruta: la foto guardada en Neon o, si no hay, un degradado con el nombre
import { imagenesApi } from '../api/servicios.api.js';

export function FotoDestino({ ruta, className = '' }) {
  if (!ruta) return null;
  return (
    <figure className={`foto-destino ${ruta.imagen_v ? '' : 'sin-foto'} ${className}`}>
      {ruta.imagen_v && <img src={imagenesApi.url('destino', ruta.id, ruta.imagen_v)} alt={`Foto de ${ruta.destino}`} loading="lazy" width="1200" height="675" />}
      <figcaption><strong>{ruta.origen} → {ruta.destino}</strong><span>Sale {ruta.hora_salida} · {ruta.duracion_horas} h</span></figcaption>
    </figure>
  );
}
