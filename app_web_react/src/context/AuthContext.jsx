// src/context/AuthContext.jsx
// Sesión y roles (usuario_rol) para toda la app: un solo login para TransAndino y el Aeropuerto
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CLAVE_TOKEN } from '../api/client.js';
import { authApi } from '../api/servicios.api.js';

const CLAVE_USUARIO = 'grupo15.usuario';
const AuthContext = createContext(null);

function leerUsuario() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO)) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => (localStorage.getItem(CLAVE_TOKEN) ? leerUsuario() : null));

  const guardar = useCallback(({ token, usuario: u }) => {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u));
    setUsuario(u);
    return u;
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    setUsuario(null);
  }, []);

  useEffect(() => {
    window.addEventListener('sesion-vencida', salir);
    return () => window.removeEventListener('sesion-vencida', salir);
  }, [salir]);

  const valor = useMemo(() => ({
    usuario,
    login: async (correo, password) => guardar(await authApi.login(correo, password)),
    registro: async (cuenta) => guardar(await authApi.registro(cuenta)),
    salir,
    // rol('aeropuerto') -> 'cliente' | 'administrador' | 'empleado' | undefined
    rol: (modulo) => usuario?.roles?.[modulo],
    tiene: (modulo, ...roles) => roles.includes(usuario?.roles?.[modulo]),
  }), [usuario, guardar, salir]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
