// src/pages/FotosPagina.jsx
// Fotos de la página (administradores): cargar las fotos de ejemplo, cambiar las de los destinos
// (admin de TransAndino) y las del aeropuerto, estacionamiento, auto, bus y paisajes. Todo se guarda en Neon.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { imagenesApi, pasajesApi } from '../api/servicios.api.js';
import { mensajeDeError } from '../api/client.js';
import { Pagina } from '../components/Pagina.jsx';
import { SubirFoto } from '../components/SubirFoto.jsx';
import { Credito } from '../components/FotoEscena.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { CLAVE_FOTOS, useFotos } from '../hooks/useFotos.js';

const entrada = (i) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.04 } });

export function FotosPagina() {
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const cliente = useQueryClient();
  const { escenas, buscar, listo } = useFotos();
  const [rutas, setRutas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const adminTA = tiene('transandino', 'administrador');

  const leerRutas = () => pasajesApi.rutas().then(setRutas).catch((e) => avisar(mensajeDeError(e), 'error'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { leerRutas(); }, []);
  const refrescar = () => { cliente.invalidateQueries({ queryKey: CLAVE_FOTOS }); leerRutas(); };

  async function cargarEjemplos(reemplazar) {
    setCargando(true);
    try {
      const r = await imagenesApi.ejemplos(reemplazar);
      avisar(r.escenas + r.destinos
        ? `Se guardaron en Neon ${r.escenas + r.destinos} fotos (${r.escenas} de la página y ${r.destinos} de destinos).`
        : 'Ya estaban todas las fotos; no se cambió nada.', r.escenas + r.destinos ? 'exito' : 'info');
      refrescar();
    } catch (err) { avisar(mensajeDeError(err), 'error'); } finally { setCargando(false); }
  }

  const total = rutas ? rutas.length + Object.keys(escenas).length : 0;
  const conFoto = rutas ? rutas.filter((r) => r.imagen_v).length + Object.keys(escenas).filter((id) => buscar('escena', id)).length : 0;

  return (
    <Pagina modulo="fotos" titulo="Fotos de la página" intro="Paisajes, aeropuerto, estacionamiento, autos y buses. Se guardan dentro de la base de datos (Neon).">
      <section className="tarjeta cargar-ejemplos">
        <div>
          <h2>Fotos de ejemplo</h2>
          <p>Fotos libres de Wikimedia Commons, ya achicadas. Se guardan en Neon con su autor y licencia.</p>
          {listo && rutas && <p className="nota"><strong>{conFoto}</strong> de {total} lugares tienen foto.</p>}
        </div>
        <div className="acciones">
          <button type="button" className="btn btn-acento" disabled={cargando} onClick={() => cargarEjemplos(false)}>
            {cargando ? 'Guardando en Neon…' : '📷 Cargar fotos de ejemplo'}
          </button>
          <button type="button" className="btn btn-borde" disabled={cargando} onClick={() => cargarEjemplos(true)} title="Vuelve a poner las de ejemplo aunque ya haya otras">Reemplazar todas</button>
        </div>
      </section>

      <h2 className="titulo-seccion">Aeropuerto, estacionamiento y paisajes</h2>
      <ul className="rejilla-destinos">
        {Object.entries(escenas).map(([id, nombre], i) => {
          const foto = buscar('escena', id);
          return (
            <motion.li key={id} className="tarjeta" {...entrada(i)}>
              <h3>{nombre}</h3>
              <SubirFoto tipo="escena" id={id} forma="banner" etiqueta="foto" vista={foto?.url} onCambio={refrescar} />
              <Credito texto={foto?.credito} />
            </motion.li>
          );
        })}
      </ul>

      <h2 className="titulo-seccion">Destinos (una foto por ruta)</h2>
      {!adminTA && <p className="nota">Solo el administrador de TransAndino cambia estas fotos; aquí puedes verlas.</p>}
      <ul className="rejilla-destinos">
        {rutas?.map((r, i) => {
          const foto = r.imagen_v ? { url: imagenesApi.url('destino', r.id, r.imagen_v), credito: buscar('destino', r.id)?.credito } : null;
          return (
            <motion.li key={r.id} className="tarjeta" {...entrada(i)}>
              <h3>{r.origen} → {r.destino}</h3>
              {adminTA
                ? <SubirFoto tipo="destino" id={r.id} forma="banner" etiqueta="foto del destino" vista={foto?.url} onCambio={refrescar} />
                : foto ? <img className="foto-vista" src={foto.url} alt={`Foto de ${r.destino}`} loading="lazy" /> : <p className="vacio">Sin foto</p>}
              <Credito texto={foto?.credito} />
            </motion.li>
          );
        })}
      </ul>
    </Pagina>
  );
}
