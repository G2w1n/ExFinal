// src/components/DialogoPago.jsx
// Pago simulado: el monto lo pone el servidor; aquí solo se elige el medio
import { useEffect, useRef, useState } from 'react';
import { mensajeDeError } from '../api/client.js';
import { soles } from '../utils/formato.js';

export function DialogoPago({ abierto, concepto, monto, permitirEfectivo = false, onPagar, onCerrar }) {
  const ref = useRef(null);
  const [metodo, setMetodo] = useState('tarjeta');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (abierto && !d.open) { d.showModal(); setError(''); setMetodo('tarjeta'); }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  async function pagar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onPagar(metodo);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <dialog ref={ref} className="dialogo" onClose={onCerrar} aria-labelledby="t-pago">
      <form onSubmit={pagar}>
        <h2 id="t-pago">Pagar</h2>
        <p className="dialogo-resumen">{concepto}<br /><strong>{soles(monto)}</strong></p>
        <fieldset className="opciones">
          <legend>Medio de pago</legend>
          <label><input type="radio" name="metodo" value="tarjeta" checked={metodo === 'tarjeta'} onChange={() => setMetodo('tarjeta')} /> Tarjeta</label>
          <label><input type="radio" name="metodo" value="billetera" checked={metodo === 'billetera'} onChange={() => setMetodo('billetera')} /> Billetera (Yape / Plin)</label>
          {permitirEfectivo && <label><input type="radio" name="metodo" value="efectivo" checked={metodo === 'efectivo'} onChange={() => setMetodo('efectivo')} /> Efectivo en ventanilla</label>}
        </fieldset>
        <p className="nota">Pago simulado para el caso académico: no se cobra nada.</p>
        {error && <p className="error-campo" role="alert">{error}</p>}
        <div className="dialogo-botones">
          <button type="button" className="btn btn-borde" onClick={onCerrar}>Cancelar</button>
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Procesando…' : `Pagar ${soles(monto)}`}</button>
        </div>
      </form>
    </dialog>
  );
}
