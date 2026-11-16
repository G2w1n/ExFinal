// src/integraciones/MisViajes.jsx
// Integración 1 (HU-15.1 · HU-15.4): pasaje + estacionamiento juntos. Se actualiza solo cada 10 segundos.
import { Link } from 'react-router-dom';
import { integracionesApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Estado } from '../components/Estado.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { fechaHora, puedeReservarEstacionamiento, soles } from '../utils/formato.js';

export function MisViajes() {
  const { datos, error, cargando, recargar } = useCarga(() => integracionesApi.misViajes(), [], { cadaSegundos: 10 });
  const vacio = datos && datos.pasajes.length === 0 && datos.reservasSinPasaje.length === 0;
  return (
    <Pagina modulo="viaje" titulo="Mis viajes" intro="Tu pasaje de TransAndino y tu estacionamiento del aeropuerto, en un solo lugar. Los estados se actualizan solos.">
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={vacio} textoVacio="Todavía no tienes viajes. Empieza comprando tu pasaje.">
        <ul className="lista-viajes">
          {datos?.pasajes.map((p) => (
            <li key={p.id} className="viaje">
              <div className="viaje-parte parte-ta">
                <p className="etiqueta-app">TransAndino · {p.codigo}</p>
                <h2>{p.origen} → {p.destino}</h2>
                <p>Sale {fechaHora(p.fecha_salida)}</p>
                <p>Llega <strong>{fechaHora(p.hora_llegada)}</strong> · asiento {p.asiento}</p>
                <p><Estado valor={p.estado} /> {soles(p.precio)}</p>
              </div>
              <div className="viaje-union" aria-hidden="true">→</div>
              <div className="viaje-parte parte-aero">
                <p className="etiqueta-app">Aeropuerto Cusco{p.reserva_codigo ? ` · ${p.reserva_codigo}` : ''}</p>
                {p.reserva_codigo ? (
                  <>
                    <h2>Estacionamiento {p.placa}</h2>
                    <p>Ingreso <strong>{fechaHora(p.fecha_hora_entrada)}</strong></p>
                    <p><Estado valor={p.reserva_estado} /> {soles(p.reserva_monto)}</p>
                  </>
                ) : puedeReservarEstacionamiento(p) ? (
                  <>
                    <h2>Sin estacionamiento</h2>
                    <p>Resérvalo con los datos de tu llegada ya llenos.</p>
                    <Link className="btn btn-aero" to={`/app/aeropuerto/reservar?pasaje=${p.id}`}>Reservar estacionamiento</Link>
                  </>
                ) : <p className="nota">{p.estado === 'cancelado' ? 'Pasaje cancelado.' : p.destino !== 'Cusco' ? 'Este viaje no llega a Cusco.' : 'Este viaje ya terminó.'}</p>}
              </div>
            </li>
          ))}
        </ul>
        {datos?.reservasSinPasaje.length > 0 && (
          <section className="bloque-secundario">
            <h2>Otras reservas de estacionamiento</h2>
            <ul className="lista-simple">
              {datos.reservasSinPasaje.map((r) => (
                <li key={r.id}><strong>{r.codigo}</strong> · {r.placa} · {fechaHora(r.fecha_hora_entrada)} · <Estado valor={r.estado} /></li>
              ))}
            </ul>
          </section>
        )}
      </Carga>
    </Pagina>
  );
}
