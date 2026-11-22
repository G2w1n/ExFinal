// src/hooks/useTema.js
// Modo claro / oscuro: se guarda en el navegador y respeta el del sistema la primera vez
import { useEffect, useState } from 'react';

const CLAVE = 'grupo15.tema';
function inicial() {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return guardado;
  } catch { /* sin almacenamiento */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState(inicial);
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    try { localStorage.setItem(CLAVE, tema); } catch { /* sin almacenamiento */ }
  }, [tema]);
  return [tema, () => setTema((t) => (t === 'oscuro' ? 'claro' : 'oscuro'))];
}
