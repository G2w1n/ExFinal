// src/context/AvisosContext.jsx
// Mensajes con Sonner: se apilan, se pueden cerrar y aceptan un botón de acción (por ejemplo, "Ver")
import { createContext, useCallback, useContext } from 'react';
import { toast, Toaster } from 'sonner';
import { useTemaActual } from '../hooks/useTema.js';

const AvisosContext = createContext(() => {});

export function AvisosProvider({ children }) {
  const tema = useTemaActual();
  const avisar = useCallback((texto, tipo = 'exito', opciones = {}) => {
    const mostrar = { exito: toast.success, error: toast.error, info: toast.info }[tipo] ?? toast;
    mostrar(texto, { duration: tipo === 'error' ? 6000 : 4000, ...opciones });
  }, []);
  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <Toaster position="bottom-right" richColors closeButton theme={tema === 'oscuro' ? 'dark' : 'light'} toastOptions={{ className: 'aviso-sonner' }} />
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
