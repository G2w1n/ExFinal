// src/crm/FichaCliente.jsx
// CRM: ficha completa del cliente (las dos apps), línea de tiempo con quién y cuándo, y notas de seguimiento
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mensajeDeError } from '../api/client.js';
import { crmApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Estado } from '../components/Estado.jsx';
import { Historial } from '../components/Historial.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { fechaHora, momento, soles } from '../utils/formato.js';

export function FichaCliente() {
  const { id } = useParams();
  const avisar = useAvisos();
  const { datos, error, cargando, recargar } = useCarga(() => crmApi.ficha(id), [id]);
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardarNota(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await crmApi.nota(id, nota);
      setNota('');
      avisar('Nota guardada.');
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    } finally {
      setEnviando(false);
    }
  }

  const c = datos?.cliente;
  return (
    <Pagina modulo="crm" titulo={c ? c.nombre : 'Ficha del cliente'} acciones={<Link className="btn btn-borde" to="/app/crm">← Clientes</Link>}>
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        {c && (
          <>
            <div className="ficha-cab tarjeta">
              <div>
                <p><Estado valor={c.segmento} /></p>
                <p>{c.correo}{c.celular && ` · ${c.celular}`}</p>
                <p className="nota">Cliente desde {momento(c.creado)}</p>
              </div>
              <div className="indicadores">
                <div className="indicador"><span>Pasajes</span><strong>{c.pasajes}</strong></div>
                <div className="indicador"><span>Reservas</span><strong>{c.reservas}</strong></div>
                <div className="indicador"><span>Pendientes</span><strong>{c.pendientes}</strong></div>
                <div className="indicador"><span>Gastado</span><strong>{soles(c.gastado)}</strong></div>
              </div>
            </div>
            <div className="rejilla-2">
              <section className="tarjeta">
                <h2>Pasajes · TransAndino</h2>
                <ul className="lista-simple">
                  {datos.pasajes.map((p) => <li key={p.id}><strong>{p.codigo}</strong> {p.origen} → {p.destino} · {fechaHora(p.fecha_salida)} · {soles(p.precio)} <Estado valor={p.estado} /></li>)}
                  {datos.pasajes.length === 0 && <li className="vacio">Sin pasajes.</li>}
                </ul>
                <h2>Reservas · Aeropuerto</h2>
                <ul className="lista-simple">
                  {datos.reservas.map((r) => <li key={r.id}><strong>{r.codigo}</strong> {r.placa}{r.tipo === 'bus' && ' (bus)'} · {fechaHora(r.fecha_hora_entrada)} · {soles(r.monto)} <Estado valor={r.estado} />{r.pasaje_codigo && <small className="enlazado"> ↔ {r.pasaje_codigo}</small>}</li>)}
                  {datos.reservas.length === 0 && <li className="vacio">Sin reservas.</li>}
                </ul>
              </section>
              <section className="tarjeta">
                <h2>Notas de seguimiento</h2>
                <form onSubmit={guardarNota} className="form-nota">
                  <label className="visualmente-oculto" htmlFor="nota">Nueva nota</label>
                  <textarea id="nota" rows={3} maxLength={500} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Prefiere asiento cama; avisar promociones." required minLength={2} />
                  <button className="btn" type="submit" disabled={enviando}>{enviando ? 'Guardando…' : 'Agregar nota'}</button>
                </form>
                <ul className="notas">
                  {datos.notas.map((n) => <li key={n.id}><p>{n.texto}</p><p className="quien">{n.autor} · {momento(n.fecha)}</p></li>)}
                </ul>
              </section>
            </div>
            <section className="tarjeta">
              <h2>Línea de tiempo (quién y cuándo)</h2>
              <Historial pasos={datos.lineaDeTiempo} conCodigo />
            </section>
          </>
        )}
      </Carga>
    </Pagina>
  );
}
