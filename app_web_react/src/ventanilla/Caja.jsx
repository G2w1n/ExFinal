// src/ventanilla/Caja.jsx
// Caja (ventanilla única): el personal de TransAndino cobra pasajes y el del Aeropuerto, estacionamiento.
// Apertura con fondo inicial, cobro con vuelto, comprobante y arqueo al cerrar.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client.js';
import { cajaApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { fechaHora, horaDe, soles } from '../utils/formato.js';

const METODOS = { efectivo: 'Efectivo', pos: 'Tarjeta en POS', billetera: 'Billetera (Yape / Plin)' };
const BILLETES = [10, 20, 50, 100, 200];

export function Caja() {
  const avisar = useAvisos();
  const [params] = useSearchParams();
  const { datos: caja, error, cargando, recargar } = useCarga(() => cajaApi.estado());
  const [fondo, setFondo] = useState('100');
  const [buscar, setBuscar] = useState(params.get('buscar') ?? '');
  const [pendientes, setPendientes] = useState([]);
  const [cobro, setCobro] = useState(null); // registro que se está cobrando
  const [metodo, setMetodo] = useState('efectivo');
  const [recibido, setRecibido] = useState('');
  const [ultimo, setUltimo] = useState(null);
  const [cierre, setCierre] = useState({ abierto: false, contado: '', nota: '' });
  const [enviando, setEnviando] = useState(false);
  const dialogo = useRef(null);
  const dialogoCierre = useRef(null);

  const abierta = Boolean(caja?.caja);
  const buscarPendientes = async (texto = buscar) => {
    try { setPendientes(await cajaApi.pendientes(texto)); } catch (err) { avisar(mensajeDeError(err), 'error'); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (abierta) buscarPendientes(); }, [abierta]);

  useEffect(() => {
    const d = dialogo.current;
    if (cobro && !d.open) d.showModal();
    if (!cobro && d.open) d.close();
  }, [cobro]);
  useEffect(() => {
    const d = dialogoCierre.current;
    if (cierre.abierto && !d.open) d.showModal();
    if (!cierre.abierto && d.open) d.close();
  }, [cierre.abierto]);

  async function abrir(e) {
    e.preventDefault();
    try {
      await cajaApi.abrir(Number(fondo));
      avisar('Caja abierta. ¡Buen turno!');
      recargar({ silencioso: true });
    } catch (err) { avisar(mensajeDeError(err), 'error'); }
  }

  function empezarCobro(p) { setCobro(p); setMetodo('efectivo'); setRecibido(''); }

  async function cobrar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await cajaApi.cobrar({ entidad: cobro.entidad, id: cobro.id, metodo, monto_recibido: metodo === 'efectivo' ? Number(recibido) : undefined });
      setUltimo(r);
      setCobro(null);
      avisar(`Cobrado · ${r.codigo}${r.vuelto != null ? ` · vuelto ${soles(r.vuelto)}` : ''}`);
      recargar({ silencioso: true });
      buscarPendientes();
    } catch (err) { avisar(mensajeDeError(err), 'error'); } finally { setEnviando(false); }
  }

  async function cerrar(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const c = await cajaApi.cerrar(Number(cierre.contado), cierre.nota);
      setCierre({ abierto: false, contado: '', nota: '' });
      avisar(`Caja cerrada · diferencia ${soles(c.diferencia)}`);
      setUltimo(null);
      recargar({ silencioso: true });
    } catch (err) { avisar(mensajeDeError(err), 'error'); } finally { setEnviando(false); }
  }

  const vuelto = cobro && metodo === 'efectivo' && recibido !== '' ? Number(recibido) - Number(cobro.monto) : null;
  const diferencia = cierre.contado === '' ? null : Number(cierre.contado) - Number(caja?.esperado ?? 0);
  const atiende = caja?.atiende ? [caja.atiende.pasajes && 'pasajes de TransAndino', caja.atiende.reservas && 'estacionamiento del Aeropuerto'].filter(Boolean).join(' y ') : '';

  return (
    <Pagina modulo="ventanilla" titulo="Caja" intro={atiende ? `Cobras ${atiende}.` : undefined}
      acciones={abierta && <button type="button" className="btn btn-borde" onClick={() => setCierre({ abierto: true, contado: '', nota: '' })}>Cerrar caja (arqueo)</button>}>
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {!abierta ? (
          <form className="tarjeta formulario abrir-caja" onSubmit={abrir}>
            <h2>Tu caja está cerrada</h2>
            <p className="nota">Ábrela con el sencillo que tienes en el cajón para empezar a cobrar.</p>
            <label>Fondo inicial (S/)<input type="number" min="0" step="0.1" value={fondo} onChange={(e) => setFondo(e.target.value)} required /></label>
            <button className="btn" type="submit">Abrir caja</button>
          </form>
        ) : (
          <>
            <div className="indicadores">
              <div className="indicador"><span>Abierta desde</span><strong>{horaDe(caja.caja.apertura)}</strong></div>
              <div className="indicador"><span>Fondo inicial</span><strong>{soles(caja.caja.monto_inicial)}</strong></div>
              {Object.keys(METODOS).map((m) => (
                <div key={m} className="indicador"><span>{METODOS[m]}</span><strong>{soles(caja.totales.find((t) => t.metodo === m)?.total ?? 0)}</strong></div>
              ))}
              <div className="indicador destacado"><span>Efectivo esperado</span><strong>{soles(caja.esperado)}</strong></div>
            </div>

            {ultimo && (
              <p className="banda-exito" role="status">
                Cobro registrado · <strong>{ultimo.codigo}</strong> · {soles(ultimo.monto)}
                {ultimo.vuelto != null && <> · vuelto <strong>{soles(ultimo.vuelto)}</strong></>} ·{' '}
                <Link to={`/app/comprobante/${ultimo.entidad}/${ultimo.id}`}>Ver comprobante</Link>
              </p>
            )}

            <section className="tarjeta">
              <h2>Pendientes de pago</h2>
              <form className="filtros" onSubmit={(e) => { e.preventDefault(); buscarPendientes(); }}>
                <label className="visualmente-oculto" htmlFor="caja-buscar">Buscar</label>
                <input id="caja-buscar" type="search" placeholder="Código, placa, nombre o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
                <button className="btn" type="submit">Buscar</button>
              </form>
              {pendientes.length === 0 ? <p className="vacio">No hay pendientes con esa búsqueda.</p> : (
                <div className="tabla-scroll">
                  <table className="tabla">
                    <thead><tr><th>Código</th><th>Cliente</th><th>Detalle</th><th>Fecha</th><th>Monto</th><th><span className="visualmente-oculto">Cobrar</span></th></tr></thead>
                    <tbody>
                      {pendientes.map((p) => (
                        <tr key={`${p.entidad}-${p.id}`}>
                          <td><strong>{p.codigo}</strong><small>{p.entidad === 'pasaje' ? 'TransAndino' : 'Aeropuerto'}</small></td>
                          <td>{p.cliente}<small>{p.correo}</small></td>
                          <td>{p.detalle}</td>
                          <td>{fechaHora(p.fecha)}</td>
                          <td><strong>{soles(p.monto)}</strong></td>
                          <td><button type="button" className={`btn ${p.entidad === 'pasaje' ? 'btn-ta' : 'btn-aero'}`} onClick={() => empezarCobro(p)}>Cobrar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="tarjeta">
              <h2>Mis cobros del turno</h2>
              {caja.cobros.length === 0 ? <p className="vacio">Aún no cobras nada en este turno.</p> : (
                <div className="tabla-scroll">
                  <table className="tabla">
                    <thead><tr><th>Hora</th><th>Operación</th><th>Código</th><th>Cliente</th><th>Medio</th><th>Monto</th><th>Vuelto</th><th><span className="visualmente-oculto">Comprobante</span></th></tr></thead>
                    <tbody>
                      {caja.cobros.map((c) => (
                        <tr key={c.codigo_operacion}>
                          <td>{horaDe(c.fecha)}</td><td>{c.codigo_operacion}</td><td>{c.codigo}</td><td>{c.cliente}</td>
                          <td>{METODOS[c.metodo] ?? c.metodo}</td><td>{soles(c.monto)}</td><td>{c.vuelto != null ? soles(c.vuelto) : '—'}</td>
                          <td><Link className="btn-fila" to={`/app/comprobante/${c.entidad}/${c.id_entidad}`}>Ticket</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </Carga>

      <dialog ref={dialogo} className="dialogo" onClose={() => setCobro(null)} aria-labelledby="t-cobro">
        {cobro && (
          <form onSubmit={cobrar}>
            <h2 id="t-cobro">Cobrar {cobro.codigo}</h2>
            <p className="dialogo-resumen">{cobro.cliente} · {cobro.detalle}<br /><strong>{soles(cobro.monto)}</strong></p>
            <label>Medio de pago
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                {Object.entries(METODOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
              </select>
            </label>
            {metodo === 'efectivo' && (
              <>
                <label>Monto recibido (S/)<input type="number" min="0" step="0.1" value={recibido} onChange={(e) => setRecibido(e.target.value)} required autoFocus /></label>
                <div className="billetes">
                  <button type="button" onClick={() => setRecibido(String(cobro.monto))}>Exacto</button>
                  {BILLETES.map((b) => <button key={b} type="button" onClick={() => setRecibido(String(b))}>S/ {b}</button>)}
                </div>
                <p className="vuelto">Vuelto: <output>{vuelto == null ? soles(0) : vuelto >= 0 ? soles(vuelto) : 'Monto insuficiente'}</output></p>
              </>
            )}
            <div className="dialogo-botones">
              <button type="button" className="btn btn-borde" onClick={() => setCobro(null)}>Cancelar</button>
              <button type="submit" className="btn" disabled={enviando || (metodo === 'efectivo' && (vuelto == null || vuelto < 0))}>{enviando ? 'Cobrando…' : 'Confirmar cobro'}</button>
            </div>
          </form>
        )}
      </dialog>

      <dialog ref={dialogoCierre} className="dialogo" onClose={() => setCierre((c) => ({ ...c, abierto: false }))} aria-labelledby="t-arqueo">
        <form onSubmit={cerrar}>
          <h2 id="t-arqueo">Arqueo y cierre de caja</h2>
          <p className="dialogo-resumen">Efectivo esperado (fondo + cobros en efectivo)<br /><strong>{soles(caja?.esperado ?? 0)}</strong></p>
          <label>Efectivo contado en el cajón (S/)<input type="number" min="0" step="0.1" value={cierre.contado} onChange={(e) => setCierre({ ...cierre, contado: e.target.value })} required /></label>
          {diferencia != null && (
            <p className={`diferencia ${Math.abs(diferencia) < 0.01 ? 'cuadra' : 'descuadre'}`}>
              Diferencia: {soles(diferencia)} {Math.abs(diferencia) < 0.01 ? '✓ cuadra' : diferencia > 0 ? '(sobra)' : '(falta)'}
            </p>
          )}
          <label>Nota (obligatoria si hay diferencia)<input value={cierre.nota} onChange={(e) => setCierre({ ...cierre, nota: e.target.value })} maxLength={200} /></label>
          <div className="dialogo-botones">
            <button type="button" className="btn btn-borde" onClick={() => setCierre({ ...cierre, abierto: false })}>Seguir atendiendo</button>
            <button type="submit" className="btn" disabled={enviando}>Cerrar caja</button>
          </div>
        </form>
      </dialog>
    </Pagina>
  );
}
