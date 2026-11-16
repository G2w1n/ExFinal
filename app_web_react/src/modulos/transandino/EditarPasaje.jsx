// src/modulos/transandino/EditarPasaje.jsx
// Actualizar de TransAndino: solo antes de pagar; el precio se recalcula en el servidor
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { pasajesApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { FormViaje } from './FormViaje.jsx';

export function EditarPasaje() {
  const { id } = useParams();
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const navegar = useNavigate();
  const [viaje, setViaje] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { datos: pasaje, error: errorCarga, cargando } = useCarga(async () => {
    const p = await pasajesApi.detalle(id);
    setViaje({ id_ruta: String(p.id_ruta), fecha: p.fecha_salida.slice(0, 10), asiento: p.asiento, equipaje_kg: p.equipaje_kg });
    return p;
  }, [id]);
  const propio = useMemo(() => pasaje && { asiento: pasaje.asiento, id_ruta: pasaje.id_ruta, fecha: pasaje.fecha_salida.slice(0, 10) }, [pasaje]);
  const volver = tiene('transandino', 'administrador', 'empleado') ? '/app/transandino/panel' : '/app/transandino/mis-pasajes';

  async function guardar(e) {
    e.preventDefault();
    if (!viaje.asiento) return setError('Elige un asiento.');
    setEnviando(true);
    setError('');
    try {
      const p = await pasajesApi.editar(id, viaje);
      avisar(`Pasaje ${p.codigo} actualizado.`);
      navegar(volver);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pagina modulo="transandino" titulo={pasaje ? `Editar ${pasaje.codigo}` : 'Editar pasaje'} intro="Solo se puede editar antes de pagar.">
      <Carga cargando={cargando} error={errorCarga}>
        {pasaje?.estado !== 'registrado'
          ? <p className="caja-error">Este pasaje ya está {pasaje?.estado}: no se puede editar.</p>
          : viaje && (
            <form className="tarjeta formulario" onSubmit={guardar}>
              <FormViaje viaje={viaje} setViaje={setViaje} propio={propio} />
              {error && <p className="error-campo" role="alert">{error}</p>}
              <div className="acciones">
                <button className="btn btn-ta" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar cambios'}</button>
                <button className="btn btn-borde" type="button" onClick={() => navegar(volver)}>Volver</button>
              </div>
            </form>
          )}
      </Carga>
    </Pagina>
  );
}
