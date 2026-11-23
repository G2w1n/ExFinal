// src/components/FotoEscena.jsx
// Foto de la página guardada en Neon (aeropuerto, estacionamiento, auto, bus o paisaje) con su crédito.
// Si todavía no hay foto, no muestra nada: la página se ve igual que antes.
import { motion } from 'framer-motion';
import { useFotos } from '../hooks/useFotos.js';

export function Credito({ texto }) {
  if (!texto) return null;
  return <small className="credito-foto">Foto: {texto}</small>;
}

export function FotoEscena({ id, titulo, texto, className = '', alt }) {
  const { buscar, escenas } = useFotos();
  const foto = buscar('escena', id);
  if (!foto) return null;
  return (
    <motion.figure className={`foto-escena ${className}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <img src={foto.url} alt={alt ?? escenas[id] ?? ''} loading="lazy" width="960" height="540" />
      {(titulo || texto) && <figcaption>{titulo && <strong>{titulo}</strong>}{texto && <span>{texto}</span>}</figcaption>}
      <Credito texto={foto.credito} />
    </motion.figure>
  );
}

// Para portadas: la foto queda de fondo (con un velo oscuro para que el texto se lea) y el crédito abajo
export function useFondoEscena(id) {
  const { buscar } = useFotos();
  const foto = buscar('escena', id);
  return foto
    ? { clase: 'con-foto', estilo: { '--foto-fondo': `url("${foto.url}")` }, credito: <Credito texto={foto.credito} /> }
    : { clase: '', estilo: undefined, credito: null };
}
