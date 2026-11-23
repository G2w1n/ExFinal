// src/hooks/useCarga.js
// Carga datos de la API con TanStack Query: caché (volver a una pantalla es instantáneo),
// recarga en segundo plano y actualización en vivo cuando llega un evento de Socket.IO.
// "enVivo: false" para formularios de edición (no se debe pisar lo que el usuario escribe).
import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mensajeDeError } from '../api/client.js';

export function useCarga(consulta, dependencias = [], { cadaSegundos = 0, enVivo = true } = {}) {
  const cliente = useQueryClient();
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;
  // La clave identifica la consulta: su código y sus dependencias (por ejemplo, el id o los filtros)
  const clave = [enVivo ? 'carga' : 'carga-fija', consulta.toString(), ...dependencias];

  const q = useQuery({
    queryKey: clave,
    queryFn: () => consultaRef.current(),
    refetchInterval: cadaSegundos ? cadaSegundos * 1000 : false,
    ...(enVivo ? {} : { staleTime: Infinity, gcTime: 0 }),
  });

  return {
    datos: q.data ?? null,
    error: q.error ? mensajeDeError(q.error) : '',
    cargando: q.isPending,
    recargar: () => q.refetch(),
    // Cambio "optimista": la pantalla se actualiza antes de que responda el servidor
    setDatos: (valor) => cliente.setQueryData(clave, (actual) => (typeof valor === 'function' ? valor(actual) : valor)),
  };
}
