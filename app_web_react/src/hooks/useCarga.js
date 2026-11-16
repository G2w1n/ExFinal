// src/hooks/useCarga.js
// Carga datos de la API con estados de carga y error; "cadaSegundos" vuelve a consultar sin recargar la página
import { useCallback, useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '../api/client.js';

export function useCarga(consulta, dependencias = [], { cadaSegundos = 0 } = {}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;

  const recargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true);
    try {
      setDatos(await consultaRef.current());
      setError('');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { recargar(); }, dependencias);

  useEffect(() => {
    if (!cadaSegundos) return undefined;
    const t = setInterval(() => { if (!document.hidden) recargar({ silencioso: true }); }, cadaSegundos * 1000);
    return () => clearInterval(t);
  }, [cadaSegundos, recargar]);

  return { datos, error, cargando, recargar, setDatos };
}
