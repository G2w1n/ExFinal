// src/context/AvisosContext.jsx
// Mensajes de éxito o error con el código de seguimiento (se anuncian a lectores de pantalla)
import { createContext, useCallback, useContext, useState } from 'react';

const AvisosContext = createContext(() => {});

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const avisar = useCallback((texto, tipo = 'exito') => {
    const id = Date.now() + Math.random();
    setAvisos((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 4500);
  }, []);
  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" aria-live="polite">
        {avisos.map((a) => (
          <p key={a.id} className={`aviso aviso-${a.tipo}`} role={a.tipo === 'error' ? 'alert' : 'status'}>
            <span aria-hidden="true">{a.tipo === 'error' ? '!' : '✓'}</span> {a.texto}
          </p>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
