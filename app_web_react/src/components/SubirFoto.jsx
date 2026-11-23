// src/components/SubirFoto.jsx
// Elegir o arrastrar una foto: se achica en el navegador, se muestra la vista previa y se guarda en Neon
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { imagenesApi } from '../api/servicios.api.js';
import { mensajeDeError } from '../api/client.js';
import { useAvisos } from '../context/AvisosContext.jsx';
import { achicarImagen, kb } from '../utils/imagen.js';

// forma: 'circulo' (perfil, cuadrada) o 'banner' (destino, 16:9)
export function SubirFoto({ tipo, id, version, vista, forma = 'circulo', etiqueta = 'foto', onCambio }) {
  const avisar = useAvisos();
  const entrada = useRef(null);
  const [estado, setEstado] = useState(null); // null | 'achicando' | 'subiendo'
  const [arrastrando, setArrastrando] = useState(false);
  const [detalle, setDetalle] = useState('');
  const [previa, setPrevia] = useState(null);
  const banner = forma === 'banner';

  async function procesar(archivo) {
    if (!archivo) return;
    try {
      setEstado('achicando');
      const r = await achicarImagen(archivo, banner ? { ancho: 1200, proporcion: 16 / 9, objetivo: 160 * 1024 } : { ancho: 400, proporcion: 1, objetivo: 60 * 1024 });
      setPrevia((p) => { if (p) URL.revokeObjectURL(p); return URL.createObjectURL(r.blob); });
      setEstado('subiendo');
      const res = await imagenesApi.subir(tipo, id, r.blob);
      setDetalle(r.blob.size < r.original
        ? `Se achicó de ${kb(r.original)} a ${kb(r.blob.size)} (${r.ancho}×${r.alto}).`
        : `Lista: ${kb(r.blob.size)} (${r.ancho}×${r.alto}).`);
      avisar(`Se guardó la ${etiqueta}.`);
      onCambio?.(String(res.version));
    } catch (err) {
      setPrevia(null);
      avisar(err.response ? mensajeDeError(err) : err.message, 'error');
    } finally {
      setEstado(null);
      if (entrada.current) entrada.current.value = '';
    }
  }

  async function quitar() {
    try {
      await imagenesApi.borrar(tipo, id);
      setPrevia(null); setDetalle('');
      avisar(`Se quitó la ${etiqueta}.`, 'info');
      onCambio?.(null);
    } catch (err) { avisar(mensajeDeError(err), 'error'); }
  }

  const imagen = previa ?? vista;
  return (
    <div className={`subir-foto ${banner ? 'es-banner' : 'es-circulo'}`}>
      <button type="button" className={`zona-foto ${arrastrando ? 'arrastrando' : ''}`} disabled={Boolean(estado)}
        onClick={() => entrada.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); procesar(e.dataTransfer.files?.[0]); }}
        aria-label={`Cambiar la ${etiqueta}: elige o arrastra una imagen`}>
        <AnimatePresence mode="wait">
          {imagen
            ? <motion.img key={imagen} src={imagen} alt="" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
            : <motion.span key="vacio" className="zona-vacia" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{banner ? '🏔' : '👤'}<small>Arrastra una foto aquí</small></motion.span>}
        </AnimatePresence>
        {estado && <span className="zona-estado" role="status">{estado === 'achicando' ? 'Achicando…' : 'Guardando…'}</span>}
      </button>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" capture={banner ? undefined : 'user'} hidden onChange={(e) => procesar(e.target.files?.[0])} />
      <div className="acciones">
        <button type="button" className="btn" disabled={Boolean(estado)} onClick={() => entrada.current?.click()}>{imagen ? 'Cambiar' : 'Subir'} {etiqueta}</button>
        {imagen && <button type="button" className="btn btn-borde" disabled={Boolean(estado)} onClick={quitar}>Quitar</button>}
      </div>
      <p className="nota">{detalle || 'JPG, PNG o WebP. Se achica sola antes de guardarse.'}</p>
    </div>
  );
}
