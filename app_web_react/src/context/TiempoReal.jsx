// src/context/TiempoReal.jsx
// Conexión en vivo (Socket.IO) con la API: cuando algo cambia, las pantallas se actualizan solas
// y se avisa lo importante (por ejemplo, "Tu espacio está listo").
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { api, CLAVE_TOKEN } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useAvisos } from './AvisosContext.jsx';

const TiempoRealContext = createContext(false);
const servidor = String(api.defaults.baseURL).replace(/\/api\/?$/, '');

// Qué se le avisa al cliente cuando cambia una de SUS cosas
const MENSAJE_CLIENTE = {
  preparado: (d) => `🅿 Tu espacio ${d.codigo} ya está listo (${d.placa}).`,
  finalizado: (d) => `🚗 Salida registrada: ${d.placa}. ¡Buen viaje!`,
  pagado: (d) => `✓ Pago recibido · ${d.codigo}`,
  abordado: (d) => `🚌 Abordaste el bus · ${d.codigo}. ¡Buen viaje!`,
};

export function TiempoRealProvider({ children }) {
  const { usuario, tiene } = useAuth();
  const consultas = useQueryClient();
  const avisar = useAvisos();
  const [conectado, setConectado] = useState(false);
  const esPersonal = ['transandino', 'aeropuerto'].some((m) => tiene(m, 'administrador', 'empleado'));

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const socket = io(servidor, { path: '/api/tiempo-real', auth: token ? { token } : {}, transports: ['websocket', 'polling'] });
    const refrescar = () => consultas.invalidateQueries({ queryKey: ['carga'] });
    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));
    socket.on('cambio-publico', refrescar);
    socket.on('cambio', (d) => {
      refrescar();
      if (!usuario) return;
      if (esPersonal) {
        if (d.accion === 'creada' || d.accion === 'comprado') avisar(`Nuevo: ${d.codigo}${d.placa ? ` · ${d.placa}` : ''}`, 'info');
      } else if (MENSAJE_CLIENTE[d.estado] && d.accion !== 'creada' && d.accion !== 'comprado') {
        avisar(MENSAJE_CLIENTE[d.estado](d), 'exito');
      }
    });
    return () => socket.close();
  // Se reconecta al iniciar o cerrar sesión (cambia el token y las salas)
  }, [usuario?.id, esPersonal, consultas, avisar]); // eslint-disable-line react-hooks/exhaustive-deps

  return <TiempoRealContext.Provider value={conectado}>{children}</TiempoRealContext.Provider>;
}

export const useEnVivo = () => useContext(TiempoRealContext);
