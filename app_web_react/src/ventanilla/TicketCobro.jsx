// src/ventanilla/TicketCobro.jsx
// El ticket "sale de la impresora" al cobrar en caja
import { Link } from 'react-router-dom';
import { CodigoQR, textoPase } from '../components/CodigoQR.jsx';
import { horaDe, soles } from '../utils/formato.js';

const METODOS = { efectivo: 'Efectivo', pos: 'Tarjeta en POS', billetera: 'Billetera' };

export function TicketCobro({ cobro, onCerrar }) {
  return (
    <div className="impresora" aria-live="polite">
      <div className="impresora-ranura" aria-hidden="true" />
      <article key={cobro.codigo_operacion} className="ticket">
        <p className="ticket-cab">Grupo 15 · Viaje a Cusco<br /><small>{cobro.entidad === 'pasaje' ? 'TransAndino · pasaje' : 'Aeropuerto · estacionamiento'}</small></p>
        <p className="ticket-codigo">{cobro.codigo}</p>
        <dl>
          <div><dt>Operación</dt><dd>{cobro.codigo_operacion}</dd></div>
          <div><dt>Hora</dt><dd>{horaDe(cobro.fecha)}</dd></div>
          <div><dt>Medio</dt><dd>{METODOS[cobro.metodo] ?? cobro.metodo}</dd></div>
          <div><dt>Total</dt><dd>{soles(cobro.monto)}</dd></div>
          {cobro.monto_recibido != null && <div><dt>Recibido</dt><dd>{soles(cobro.monto_recibido)}</dd></div>}
          {cobro.vuelto != null && <div className="ticket-vuelto"><dt>Vuelto</dt><dd>{soles(cobro.vuelto)}</dd></div>}
        </dl>
        <CodigoQR texto={textoPase(cobro.codigo, cobro.codigo_operacion)} tamano={110} etiqueta={`QR de ${cobro.codigo}`} />
        <p className="ticket-pie">¡Gracias por su preferencia!</p>
        <div className="ticket-acciones">
          <Link className="btn-fila" to={`/app/comprobante/${cobro.entidad}/${cobro.id}`}>Imprimir</Link>
          <button type="button" className="btn-fila" onClick={onCerrar}>Listo</button>
        </div>
      </article>
    </div>
  );
}
