// src/modulos/transandino/ComprarPasaje.jsx
// Registro de TransAndino: comprar pasaje. El personal también vende en ventanilla (venta presencial).
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { pasajesApi } from '../../api/servicios.api.js';
import { DialogoPago } from '../../components/DialogoPago.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { fechaHora, hoyEnLima, soles } from '../../utils/formato.js';
import { FormViaje } from './FormViaje.jsx';

export function ComprarPasaje() {
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const [params] = useSearchParams();
  const esPersonal = tiene('transandino', 'administrador', 'empleado');
  const [viaje, setViaje] = useState({ id_ruta: params.get('ruta') ?? '', fecha: params.get('fecha') ?? hoyEnLima(), asiento: null, equipaje_kg: 15 });
  const [correoCliente, setCorreoCliente] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [comprado, setComprado] = useState(null);
  const [pagando, setPagando] = useState(false);

  async function comprar(e) {
    e.preventDefault();
    if (!viaje.asiento) return setError('Elige tu asiento en el mapa.');
    setEnviando(true);
    setError('');
    try {
      const p = await pasajesApi.comprar({ ...viaje, correo_cliente: esPersonal ? correoCliente : undefined });
      setComprado(p);
      avisar(`Pasaje registrado · ${p.codigo}`);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  async function pagar(metodo) {
    const { pasaje } = await pasajesApi.pagar(comprado.id, metodo);
    setComprado(pasaje);
    setPagando(false);
    avisar(`Pago aprobado · ${pasaje.codigo}`);
  }

  if (comprado) {
    return (
      <Pagina modulo="transandino" titulo="Pasaje registrado">
        <div className="tarjeta confirmacion">
          <p className="codigo-grande">{comprado.codigo}</p>
          <p><strong>{comprado.origen} → {comprado.destino}</strong> · asiento {comprado.asiento} ({comprado.tipo_asiento})</p>
          <p>Sale {fechaHora(comprado.fecha_salida)} · llega {fechaHora(comprado.hora_llegada)}</p>
          <p>Total {soles(comprado.precio)} · <Estado valor={comprado.estado} /></p>
          <div className="acciones">
            {comprado.estado === 'registrado' && <button type="button" className="btn btn-ta" onClick={() => setPagando(true)}>Pagar ahora</button>}
            {!esPersonal && (
              <Link className="btn btn-aero" to={`/app/aeropuerto/reservar?pasaje=${comprado.id}`}>Reservar estacionamiento</Link>
            )}
            <Link className="btn btn-borde" to={esPersonal ? '/app/transandino/panel' : '/app/transandino/mis-pasajes'}>{esPersonal ? 'Ir al panel' : 'Ver mis pasajes'}</Link>
            <button type="button" className="btn btn-borde" onClick={() => { setComprado(null); setViaje({ ...viaje, asiento: null }); }}>Comprar otro</button>
          </div>
          {!esPersonal && <p className="nota">¿Llegas al aeropuerto? Reserva tu estacionamiento: la fecha y la hora ya vienen llenas.</p>}
        </div>
        <DialogoPago abierto={pagando} concepto={`Pasaje ${comprado.codigo}`} monto={comprado.precio} permitirEfectivo={esPersonal}
          onPagar={pagar} onCerrar={() => setPagando(false)} />
      </Pagina>
    );
  }

  return (
    <Pagina modulo="transandino" titulo={esPersonal ? 'Venta presencial' : 'Comprar pasaje'}
      intro={esPersonal ? 'Vende un pasaje en ventanilla a un cliente registrado.' : 'Elige tu ruta, la fecha y tu asiento.'}>
      <form className="tarjeta formulario" onSubmit={comprar}>
        {esPersonal && (
          <label>Correo del cliente
            <input type="email" value={correoCliente} onChange={(e) => setCorreoCliente(e.target.value)} required placeholder="cliente1@correo.com" />
          </label>
        )}
        <FormViaje viaje={viaje} setViaje={setViaje} />
        {error && <p className="error-campo" role="alert">{error}</p>}
        <button className="btn btn-ta" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Registrar pasaje'}</button>
      </form>
    </Pagina>
  );
}
