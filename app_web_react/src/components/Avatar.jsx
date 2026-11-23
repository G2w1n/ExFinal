// src/components/Avatar.jsx
// Foto de perfil guardada en Neon; sin foto muestra las iniciales con un color fijo por persona
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { imagenesApi } from '../api/servicios.api.js';

const COLORES = ['#1f6b45', '#1d5fa8', '#b5541b', '#7a3e9d', '#0f766e', '#a1395a', '#4d5d1c'];
export const iniciales = (nombre = '') => nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';

// URL temporal (blob:) de la foto de perfil; null si no hay foto
export function useFotoPerfil(id, version) {
  const { data: blob } = useQuery({
    queryKey: ['imagen', 'perfil', id, version],
    queryFn: () => imagenesApi.blob('perfil', id, version),
    enabled: Boolean(id && version),
    staleTime: Infinity,
    retry: false,
  });
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob || !version) { setUrl(null); return undefined; }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob, version]);
  return url;
}

export function Avatar({ id, nombre, version, tamano = 40, className = '' }) {
  const url = useFotoPerfil(id, version);

  const estilo = { width: tamano, height: tamano, fontSize: Math.round(tamano * 0.4), background: COLORES[(Number(id) || 0) % COLORES.length] };
  return (
    <span className={`avatar ${className}`} style={estilo} aria-hidden="true">
      {url ? <img src={url} alt="" width={tamano} height={tamano} /> : iniciales(nombre)}
    </span>
  );
}
