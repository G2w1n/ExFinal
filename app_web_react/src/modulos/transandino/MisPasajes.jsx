// src/modulos/transandino/MisPasajes.jsx
// Consulta de TransAndino: los pasajes del cliente con su estado y acciones
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { pasajesApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { DialogoPago } from '../../components/DialogoPago.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Historial } from '../../components/Historial.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { fechaHora, puedeReservarEstacionamiento, soles } from '../../utils/formato.js';

export function MisPasajes() {
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const { datos, error, cargando, recargar } = useCarga(() => pasajesApi.mios());
  const [pagando, setPagando] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [historial, setHistorial] = useState([]);

  async function verHistorial(p) {
    if (abierto === p.id) return setAbierto(null);
    setAbierto(p.id);
    setHistorial(await pasajesApi.historial(p.id).catch(() => []));
  }

  async function cancelar(p) {
    if (!confirm(`¿Cancelar el pasaje ${p.codigo}?`)) return;
    try {
      await pasajesApi.cancelar(p.id);
      avisar(`Pasaje ${p.codigo} cancelado.`);
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    }
  }

  async function pagar(metodo) {
    await pasajesApi.pagar(pagando.id, metodo);
    avisar(`Pago aprobado · ${pagando.codigo}`);
    setPagando(null);
    recargar({ silencioso: true });
  }

  return (
    <Pagina modulo="transandino" titulo="Mis pasajes" acciones={<Link className="btn btn-ta" to="/app/transandino/comprar">Comprar pasaje</Link>}>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="Aún no compras pasajes.">
        <ul className="lista-tarjetas">
          {datos?.map((p) => (
            <li key={p.id} className="tarjeta item">
              <div className="item-cab">
                <div>
                  <p className="item-codigo">{p.codigo}</p>
                  <h2>{p.origen} → {p.destino}</h2>
                  <p className="item-detalle">Sale {fechaHora(p.fecha_salida)} · llega {fechaHora(p.hora_llegada)} · asiento {p.asiento} ({p.tipo_asiento}) · {p.equipaje_kg} kg</p>
                  {p.reserva_codigo && <p className="item-enlace">Estacionamiento {p.reserva_codigo} · <Estado valor={p.reserva_estado} /></p>}
                </div>
                <div className="item-lado"><Estado valor={p.estado} /><strong>{soles(p.precio)}</strong></div>
              </div>
              <div className="acciones">
                {p.estado === 'registrado' && <button type="button" className="btn btn-ta" onClick={() => setPagando(p)}>Pagar</button>}
                {p.estado === 'registrado' && <Link className="btn btn-borde" to={`/app/transandino/pasajes/${p.id}/editar`}>Editar</Link>}
                {!p.reserva_codigo && puedeReservarEstacionamiento(p) && tiene('aeropuerto', 'cliente') && (
                  <Link className="btn btn-aero" to={`/app/aeropuerto/reservar?pasaje=${p.id}`}>Reservar estacionamiento</Link>
                )}
                {p.estado === 'registrado' && <button type="button" className="btn btn-peligro" onClick={() => cancelar(p)}>Cancelar</button>}
                {['pagado', 'abordado'].includes(p.estado) && <Link className="btn btn-borde" to={`/app/comprobante/pasaje/${p.id}`}>Comprobante</Link>}
                <button type="button" className="btn btn-borde" aria-expanded={abierto === p.id} onClick={() => verHistorial(p)}>Seguimiento</button>
              </div>
              {abierto === p.id && <Historial pasos={historial} />}
            </li>
          ))}
        </ul>
      </Carga>
      {pagando && (
        <DialogoPago abierto concepto={`Pasaje ${pagando.codigo}`} monto={pagando.precio} onPagar={pagar} onCerrar={() => setPagando(null)} />
      )}
    </Pagina>
  );
}
