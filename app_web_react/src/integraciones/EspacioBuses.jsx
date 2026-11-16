// src/integraciones/EspacioBuses.jsx
// Integración 2 (HU-15.2): el administrador de TransAndino reserva espacio para sus buses con su misma cuenta
import { useState } from 'react';
import { mensajeDeError } from '../api/client.js';
import { integracionesApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Estado } from '../components/Estado.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { FormReserva } from '../modulos/aeropuerto/FormReserva.jsx';
import { dentroDe, fechaHora, soles } from '../utils/formato.js';

export function EspacioBuses() {
  const avisar = useAvisos();
  const { datos, error, cargando, recargar } = useCarga(() => integracionesApi.misBuses(), [], { cadaSegundos: 15 });
  const [reserva, setReserva] = useState({ placa: '', nombre_pasajero: 'TransAndino Perú', fecha_hora_entrada: `${dentroDe(24).slice(0, 10)}T06:00`, horas: 2, zona_vip: false });
  const [errorForm, setErrorForm] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setErrorForm('');
    try {
      const r = await integracionesApi.espacioBus(reserva);
      avisar(`Reserva registrada · ${r.codigo}. El aeropuerto asignará la zona.`);
      setReserva({ ...reserva, placa: '' });
      recargar({ silencioso: true });
    } catch (err) {
      setErrorForm(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Espacio para buses" intro="Como cliente del aeropuerto, TransAndino reserva espacio para sus buses de traslado. El empleado del aeropuerto asigna la zona.">
      <form className="tarjeta formulario" onSubmit={guardar}>
        <div className="fila-2">
          <label>Empresa <span className="precargado">precargado</span><input className="campo-precargado" value="TransAndino Perú" readOnly /></label>
          <label>Tipo <span className="precargado">precargado</span><input className="campo-precargado" value="Bus" readOnly /></label>
        </div>
        <FormReserva reserva={reserva} setReserva={setReserva} tipo="bus" sinNombre />
        {errorForm && <p className="error-campo" role="alert">{errorForm}</p>}
        <button className="btn btn-aero" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Reservar espacio'}</button>
      </form>
      <h2 className="subtitulo">Mis reservas en el aeropuerto</h2>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="Aún no reservas espacio para buses.">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Reserva</th><th>Placa</th><th>Ingreso</th><th>Horas</th><th>Monto</th><th>Zona</th><th>Estado</th></tr></thead>
            <tbody>
              {datos?.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.codigo}</strong></td><td>{r.placa}</td><td>{fechaHora(r.fecha_hora_entrada)}</td><td>{r.horas} h</td>
                  <td>{soles(r.monto)}</td><td>{r.zona ? <span className="estado estado-verde">zona {r.zona} asignada</span> : <span className="estado estado-gris">por asignar</span>}</td>
                  <td><Estado valor={r.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carga>
    </Pagina>
  );
}
