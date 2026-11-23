// src/hooks/useFotos.js
// Qué fotos públicas hay en Neon (destinos y fotos de la página) con su versión y crédito; se pide una vez
import { useQuery } from '@tanstack/react-query';
import { imagenesApi } from '../api/servicios.api.js';

export const CLAVE_FOTOS = ['fotos-catalogo'];

// Ids fijos de las fotos de la página (iguales a los de la API)
export const ESCENA = { aeropuerto: 1, estacionamiento: 2, auto: 3, bus: 4 };
export const PAISAJES = [11, 12, 13, 14, 15, 16];

export function useFotos() {
  const { data } = useQuery({ queryKey: CLAVE_FOTOS, queryFn: imagenesApi.catalogo, staleTime: 5 * 60 * 1000, retry: 1 });
  const fotos = data?.fotos ?? [];
  const buscar = (tipo, id) => {
    const f = fotos.find((x) => x.tipo === tipo && Number(x.id) === Number(id));
    return f ? { url: imagenesApi.url(tipo, id, f.version), credito: f.credito, version: f.version } : null;
  };
  return { listo: Boolean(data), escenas: data?.escenas ?? {}, buscar };
}
