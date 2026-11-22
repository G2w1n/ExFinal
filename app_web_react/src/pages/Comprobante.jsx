// src/pages/Comprobante.jsx
// Comprobante imprimible de un pasaje o una reserva pagada, con QR.
// El QR de la reserva es el pase de salida que lee la garita.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pasajesApi, reservasApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { CodigoQR, textoPase } from '../components/CodigoQR.jsx';
import { Estado } from '../components/Estado.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { fechaHora, momento, soles } from '../utils/formato.js';

const METODOS = { tarjeta: 'Tarjeta', billetera: 'Billetera (Yape / Plin)', efectivo: 'Efectivo', pos: 'Tarjeta en POS' };

function Dato({ nombre, valor }) {
  return <div className="dato"><dt>{nombre}</dt><dd>{valor ?? '—'}</dd></div>;
}

export function Comprobante() {
  const { tipo, id } = useParams();
  const esPasaje = tipo === 'pasaje';
  const { datos, error, cargando, recargar } = useCarga(() => (esPasaje ? pasajesApi : reservasApi).comprobante(id), [tipo, id]);
  useEffect(() => { document.title = 'Comprobante · Viaje a Cusco'; }, []);
  const r = datos && (esPasaje ? datos.pasaje : datos.reserva);
  const pago = datos?.pago;

  return (
    <section className="pagina">
      <div className="pagina-cabecera no-imprimir">
        <div><p className="miga">{esPasaje ? 'TransAndino' : 'Aeropuerto Cusco'} › Comprobante</p><h1>Comprobante</h1></div>
        <div className="pagina-acciones">
          <button type="button" className="btn" onClick={() => window.print()} disabled={!datos}>Imprimir</button>
          <Link className="btn btn-borde" to={esPasaje ? '/app/transandino/mis-pasajes' : '/app/aeropuerto/mis-reservas'}>Volver</Link>
        </div>
      </div>
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {r && pago && (
          <article className={`constancia ${esPasaje ? 'constancia-ta' : 'constancia-aero'}`}>
            <header className="constancia-cab">
              <strong>{esPasaje ? 'TransAndino Perú' : 'Aeropuerto Internacional del Cusco'}</strong>
              <span>{esPasaje ? 'Pasaje en bus' : 'Estacionamiento'} · Grupo 15</span>
            </header>
            <div className="constancia-pase">
              <span aria-hidden="true">✓</span>
              <div>
                <strong>{esPasaje ? 'Pasaje pagado' : 'Pase de salida habilitado'}</strong>
                <small>{esPasaje ? 'Muestra este código al abordar' : 'Muestra este código QR en la garita'}</small>
              </div>
            </div>
            <div className="constancia-cuerpo">
              <dl className="datos">
                <Dato nombre={esPasaje ? 'Pasaje' : 'Reserva'} valor={r.codigo} />
                <Dato nombre="N.º de operación" valor={pago.codigo_operacion} />
                {esPasaje ? (
                  <>
                    <Dato nombre="Pasajero" valor={r.cliente} />
                    <Dato nombre="Ruta" valor={`${r.origen} → ${r.destino}`} />
                    <Dato nombre="Salida" valor={fechaHora(r.fecha_salida)} />
                    <Dato nombre="Llegada" valor={fechaHora(r.hora_llegada)} />
                    <Dato nombre="Asiento" valor={`${r.asiento} (${r.tipo_asiento})`} />
                    <Dato nombre="Equipaje" valor={`${r.equipaje_kg} kg`} />
                    {r.reserva_codigo && <Dato nombre="Estacionamiento" valor={r.reserva_codigo} />}
                  </>
                ) : (
                  <>
                    <Dato nombre="Pasajero" valor={r.nombre_pasajero} />
                    <Dato nombre="Placa" valor={r.placa} />
                    <Dato nombre="Ingreso" valor={fechaHora(r.fecha_hora_entrada)} />
                    <Dato nombre="Estadía" valor={`${r.horas} h${r.zona_vip ? ' · zona VIP' : ''}${r.tipo === 'bus' ? ' · bus' : ''}`} />
                    {r.zona && <Dato nombre="Zona" valor={r.zona} />}
                    {r.pasaje_codigo && <Dato nombre="Pasaje enlazado" valor={r.pasaje_codigo} />}
                  </>
                )}
                <Dato nombre="Medio de pago" valor={METODOS[pago.metodo] ?? pago.metodo} />
                {pago.cajero && <Dato nombre="Atendido por" valor={pago.cajero} />}
                <Dato nombre="Fecha de pago" valor={momento(pago.fecha)} />
                <Dato nombre="Estado" valor={<Estado valor={r.estado} />} />
              </dl>
              <p className="constancia-total"><span>Total pagado</span><strong>{soles(pago.monto)}</strong></p>
            </div>
            <footer className="constancia-pie">
              <CodigoQR texto={textoPase(r.codigo, pago.codigo_operacion)} etiqueta={`Código QR de ${r.codigo}`} />
              <p>{r.codigo}</p>
            </footer>
          </article>
        )}
      </Carga>
    </section>
  );
}
