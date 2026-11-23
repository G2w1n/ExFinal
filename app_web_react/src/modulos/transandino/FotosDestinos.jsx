// src/modulos/transandino/FotosDestinos.jsx
// Administrador de TransAndino: una foto por ruta (se guarda en Neon y se ve al comprar el pasaje y en la portada)
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { imagenesApi, pasajesApi } from '../../api/servicios.api.js';
import { mensajeDeError } from '../../api/client.js';
import { Pagina } from '../../components/Pagina.jsx';
import { SubirFoto } from '../../components/SubirFoto.jsx';

export function FotosDestinos() {
  const [rutas, setRutas] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { pasajesApi.rutas().then(setRutas).catch((e) => setError(mensajeDeError(e))); }, []);

  const cambiar = (id, v) => setRutas((rs) => rs.map((r) => (r.id === id ? { ...r, imagen_v: v } : r)));

  return (
    <Pagina modulo="transandino" titulo="Fotos de destinos" intro="Sube una foto por ruta. Se achica sola (formato 16:9) y se guarda en la base de datos.">
      {error && <p className="caja-error">{error}</p>}
      {!rutas && !error && <p className="carga">Cargando rutas…</p>}
      <ul className="rejilla-destinos">
        {rutas?.map((r, i) => (
          <motion.li key={r.id} className="tarjeta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <h2>{r.origen} → {r.destino}</h2>
            <p className="nota">Sale {r.hora_salida} · {r.duracion_horas} h</p>
            <SubirFoto tipo="destino" id={r.id} forma="banner" etiqueta="foto del destino"
              vista={r.imagen_v ? imagenesApi.url('destino', r.id, r.imagen_v) : null}
              onCambio={(v) => cambiar(r.id, v)} />
          </motion.li>
        ))}
      </ul>
    </Pagina>
  );
}
