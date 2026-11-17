// src/modulos/aeropuerto/MisReservas.jsx
// Consulta del Aeropuerto: las reservas del cliente
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { reservasApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { DialogoPago } from '../../components/DialogoPago.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Historial } from '../../components/Historial.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { fechaHora, soles } from '../../utils/formato.js';

export function MisReservas() {
  const avisar = useAvisos();
  const { datos, error, cargando, recargar } = useCarga(() => reservasApi.mias());
  const [pagando, setPagando] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [historial, setHistorial] = useState([]);

  async function verHistorial(r) {
    if (abierto === r.id) return setAbierto(null);
    setAbierto(r.id);
    setHistorial(await reservasApi.historial(r.id).catch(() => []));
  }

  async function cancelar(r) {
    if (!confirm(`¿Cancelar la reserva ${r.codigo}?`)) return;
    try {
      await reservasApi.cancelar(r.id);
      avisar(`Reserva ${r.codigo} cancelada.`);
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    }
  }

  async function pagar(metodo) {
    await reservasApi.pagar(pagando.id, metodo);
    avisar(`Pago aprobado · ${pagando.codigo}`);
    setPagando(null);
    recargar({ silencioso: true });
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Mis reservas" acciones={<Link className="btn btn-aero" to="/app/aeropuerto/reservar">Nueva reserva</Link>}>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="Aún no tienes reservas de estacionamiento.">
        <ul className="lista-tarjetas">
          {datos?.map((r) => (
            <li key={r.id} className="tarjeta item">
              <div className="item-cab">
                <div>
                  <p className="item-codigo">{r.codigo}{r.tipo === 'bus' && ' · bus'}</p>
                  <h2>{r.placa}</h2>
                  <p className="item-detalle">Ingreso {fechaHora(r.fecha_hora_entrada)} · {r.horas} h{r.zona_vip ? ' · VIP' : ''}{r.zona ? ` · zona ${r.zona}` : ''}</p>
                  {r.pasaje_codigo && <p className="item-enlace">Enlazada al pasaje {r.pasaje_codigo} ({r.pasaje_origen} → Cusco)</p>}
                </div>
                <div className="item-lado"><Estado valor={r.estado} /><strong>{soles(r.monto)}</strong></div>
              </div>
              <div className="acciones">
                {r.estado === 'registrado' && <button type="button" className="btn btn-aero" onClick={() => setPagando(r)}>Pagar</button>}
                {r.estado === 'registrado' && <Link className="btn btn-borde" to={`/app/aeropuerto/reservas/${r.id}/editar`}>Editar</Link>}
                {r.estado === 'registrado' && <button type="button" className="btn btn-peligro" onClick={() => cancelar(r)}>Cancelar</button>}
                {['pagado', 'preparado', 'finalizado'].includes(r.estado) && <Link className="btn btn-borde" to={`/app/comprobante/reserva/${r.id}`}>Comprobante (QR)</Link>}
                <button type="button" className="btn btn-borde" aria-expanded={abierto === r.id} onClick={() => verHistorial(r)}>Seguimiento</button>
              </div>
              {abierto === r.id && <Historial pasos={historial} />}
            </li>
          ))}
        </ul>
      </Carga>
      {pagando && <DialogoPago abierto concepto={`Estacionamiento ${pagando.codigo}`} monto={pagando.monto} onPagar={pagar} onCerrar={() => setPagando(null)} />}
    </Pagina>
  );
}
