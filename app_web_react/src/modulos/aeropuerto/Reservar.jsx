// src/modulos/aeropuerto/Reservar.jsx
// Registro del Aeropuerto: reservar estacionamiento.
// Integración 1: si llega con ?pasaje=ID, los datos del pasaje de TransAndino vienen precargados.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { integracionesApi, reservasApi } from '../../api/servicios.api.js';
import { DialogoPago } from '../../components/DialogoPago.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { PasosViaje } from '../../components/PasosViaje.jsx';
import { Animacion } from '../../components/Animacion.jsx';
import { lanzarConfeti } from '../../utils/confeti.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { dentroDe, fechaHora, soles } from '../../utils/formato.js';
import { FormReserva } from './FormReserva.jsx';

export function Reservar() {
  const { usuario } = useAuth();
  const avisar = useAvisos();
  const [params] = useSearchParams();
  const idPasaje = params.get('pasaje');
  const [reserva, setReserva] = useState({ placa: '', nombre_pasajero: usuario.nombre, fecha_hora_entrada: dentroDe(3).slice(0, 14) + '00', horas: 4, zona_vip: false });
  const [pasaje, setPasaje] = useState(null);
  const [errorPasaje, setErrorPasaje] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [creada, setCreada] = useState(null);
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    if (!idPasaje) return;
    integracionesApi.prellenado(idPasaje)
      .then((p) => {
        setPasaje(p);
        setReserva((r) => ({ ...r, fecha_hora_entrada: p.fecha_hora_entrada, nombre_pasajero: p.nombre_pasajero, horas: p.horas }));
      })
      .catch((e) => setErrorPasaje(mensajeDeError(e)));
  }, [idPasaje]);

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError('');
    try {
      const r = await reservasApi.crear({ ...reserva, id_pasaje: pasaje?.id_pasaje });
      setCreada(r);
      avisar(`Reserva registrada · ${r.codigo}`);
      // Viaje completo (pasaje + estacionamiento): ¡celebración!
      if (r.pasaje_codigo) lanzarConfeti();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  async function pagar(metodo) {
    const { reserva: r } = await reservasApi.pagar(creada.id, metodo);
    setCreada(r);
    setPagando(false);
    avisar(`Pago aprobado · ${r.codigo}`);
  }

  if (creada) {
    return (
      <Pagina modulo="aeropuerto" titulo={creada.pasaje_codigo ? '¡Tu viaje está listo!' : 'Reserva registrada'}>
        {creada.pasaje_codigo && <PasosViaje actual={3} />}
        <div className="tarjeta confirmacion entrar-arriba">
          {(creada.pasaje_codigo || creada.estado === 'pagado') && <Animacion nombre="check" className="lottie-check" etiqueta={creada.estado === 'pagado' ? 'Pago aprobado' : 'Viaje listo'} />}
          <p className="codigo-grande">{creada.codigo}</p>
          <p><strong>{creada.placa}</strong> · ingreso {fechaHora(creada.fecha_hora_entrada)} · {creada.horas} h{creada.zona_vip ? ' · VIP' : ''}</p>
          {creada.pasaje_codigo && <p className="item-enlace">Enlazada a tu pasaje {creada.pasaje_codigo}</p>}
          <p>Total {soles(creada.monto)} · <Estado valor={creada.estado} /></p>
          <div className="acciones">
            {creada.estado === 'registrado' && <button type="button" className="btn btn-aero" onClick={() => setPagando(true)}>Pagar ahora</button>}
            {creada.estado === 'pagado' && <Link className="btn btn-borde" to={`/app/comprobante/reserva/${creada.id}`}>Comprobante (QR)</Link>}
            <Link className="btn btn-borde" to={creada.pasaje_codigo ? '/app/mis-viajes' : '/app/aeropuerto/mis-reservas'}>{creada.pasaje_codigo ? 'Ver Mis viajes' : 'Ver mis reservas'}</Link>
          </div>
        </div>
        <DialogoPago abierto={pagando} concepto={`Estacionamiento ${creada.codigo}`} monto={creada.monto} onPagar={pagar} onCerrar={() => setPagando(false)} />
      </Pagina>
    );
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Reservar estacionamiento" intro="A 50 metros del terminal, abierto las 24 horas.">
      {pasaje && <PasosViaje actual={2} />}
      {pasaje && (
        <p className="banda-info">
          Pasaje <strong>{pasaje.pasaje_codigo}</strong> · {pasaje.ruta} · llegas el {fechaHora(pasaje.hora_llegada)}.
          Ya llenamos tus datos: solo escribe tu placa.
        </p>
      )}
      {errorPasaje && <p className="caja-error" role="alert">{errorPasaje}</p>}
      <form className="tarjeta formulario" onSubmit={guardar}>
        {pasaje && (
          <label>Pasaje <span className="precargado">precargado</span>
            <input className="campo-precargado" value={`${pasaje.pasaje_codigo} · ${pasaje.ruta}`} readOnly />
          </label>
        )}
        <FormReserva reserva={reserva} setReserva={setReserva} precargados={pasaje ? ['fecha_hora_entrada', 'nombre_pasajero', 'horas'] : []} />
        {error && <p className="error-campo" role="alert">{error}</p>}
        <button className="btn btn-aero" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Reservar'}</button>
      </form>
    </Pagina>
  );
}
