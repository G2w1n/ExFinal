// src/ventanilla/Garita.jsx
// Garita de salida del estacionamiento (traída del Parcial): lee con la cámara el QR del comprobante
// (o se escribe la placa o el código), dice si puede salir y registra la salida.
import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Link } from 'react-router-dom';
import { mensajeDeError } from '../api/client.js';
import { reservasApi } from '../api/servicios.api.js';
import { Estado } from '../components/Estado.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { fechaHora, dentroDe, soles } from '../utils/formato.js';
import { sumarHorasTexto } from '../utils/fechas.js';
import { Barrera } from './Barrera.jsx';

// "G15|EST-00018|OP-…" -> "EST-00018"; también acepta la placa o el código escritos a mano
function leerCriterio(texto) {
  const limpio = String(texto ?? '').trim();
  if (limpio.startsWith('G15|')) return limpio.split('|')[1];
  return limpio;
}

function veredicto(r) {
  const salida = sumarHorasTexto(r.fecha_hora_entrada, Number(r.horas));
  const excedido = ['pagado', 'preparado'].includes(r.estado) && salida < dentroDe(0);
  if (r.estado === 'cancelado') return { clase: 'cancelada', texto: 'Reserva cancelada: no corresponde salida.' };
  if (r.estado === 'finalizado') return { clase: 'usada', texto: 'Este pase ya se usó: el vehículo ya salió.' };
  if (r.estado === 'registrado') return { clase: 'pendiente', texto: `Pendiente de pago (${soles(r.monto)}): envíalo a caja.` };
  if (excedido) return { clase: 'exceso', texto: `Salida habilitada, pero pasó la hora reservada (${fechaHora(salida)}). Avisa a caja.`, puede: true };
  return { clase: 'habilitada', texto: '✓ Salida habilitada', puede: true };
}

export function Garita() {
  const avisar = useAvisos();
  const video = useRef(null);
  const lienzo = useRef(null);
  const flujo = useRef(null);
  const ultimo = useRef({ texto: '', momento: 0 });
  const [camara, setCamara] = useState(false);
  const [criterio, setCriterio] = useState('');
  const [resultado, setResultado] = useState(null); // { criterio, filas, error }
  const [salidas, setSalidas] = useState([]);
  const [barrera, setBarrera] = useState({ abierta: false, placa: '' });

  async function consultar(texto) {
    const c = leerCriterio(texto);
    if (!c) return;
    setCriterio(c);
    if (/^PAS-/i.test(c)) return setResultado({ criterio: c, filas: [], error: 'Ese es el QR de un pasaje de bus, no de un estacionamiento.' });
    setResultado({ criterio: c, filas: null });
    try {
      const filas = (await reservasApi.listar({ buscar: c })).filter((r) => r.codigo.toUpperCase() === c.toUpperCase() || r.placa === c.toUpperCase());
      setResultado({ criterio: c, filas });
    } catch (err) {
      setResultado({ criterio: c, filas: [], error: mensajeDeError(err) });
    }
  }

  async function registrarSalida(r) {
    try {
      await reservasApi.estado(r.id, 'finalizado');
      avisar(`Salida registrada: ${r.placa}. ¡Buen viaje!`);
      setBarrera({ abierta: true, placa: r.placa });
      setTimeout(() => setBarrera({ abierta: false, placa: '' }), 3500);
      setSalidas((s) => [{ placa: r.placa, codigo: r.codigo, hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) }, ...s].slice(0, 10));
      consultar(r.codigo);
    } catch (err) { avisar(mensajeDeError(err), 'error'); }
  }

  // Cámara: busca un QR en cada cuadro; el mismo código no se repite durante 4 segundos
  useEffect(() => {
    if (!camara) return undefined;
    let activo = true;
    (async () => {
      try {
        flujo.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        video.current.srcObject = flujo.current;
        await video.current.play();
        const ctx = lienzo.current.getContext('2d', { willReadFrequently: true });
        const escanear = () => {
          if (!activo) return;
          const v = video.current;
          if (v.readyState === v.HAVE_ENOUGH_DATA) {
            const ancho = Math.min(640, v.videoWidth);
            const alto = Math.round((v.videoHeight / v.videoWidth) * ancho);
            lienzo.current.width = ancho; lienzo.current.height = alto;
            ctx.drawImage(v, 0, 0, ancho, alto);
            const qr = jsQR(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto, { inversionAttempts: 'dontInvert' });
            if (qr?.data && (qr.data !== ultimo.current.texto || Date.now() - ultimo.current.momento > 4000)) {
              ultimo.current = { texto: qr.data, momento: Date.now() };
              navigator.vibrate?.(120);
              consultar(qr.data);
            }
          }
          requestAnimationFrame(escanear);
        };
        requestAnimationFrame(escanear);
      } catch (err) {
        avisar(err.name === 'NotAllowedError' ? 'No se dio permiso para usar la cámara. Escribe la placa o el código.' : 'No se pudo encender la cámara.', 'error');
        setCamara(false);
      }
    })();
    return () => { activo = false; flujo.current?.getTracks().forEach((t) => t.stop()); flujo.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camara]);

  return (
    <Pagina modulo="ventanilla" titulo="Garita de salida" intro="Lee el QR del comprobante del estacionamiento o escribe la placa o el código.">
      <div className="garita-grid">
        <section className="tarjeta">
          <div className={`camara ${camara ? 'activa' : ''}`}>
            <video ref={video} muted playsInline aria-label="Vista de la cámara" />
            {!camara && <p>La cámara está apagada</p>}
            <canvas ref={lienzo} hidden />
          </div>
          <button type="button" className="btn btn-ancho" onClick={() => setCamara(!camara)}>{camara ? 'Apagar cámara' : 'Encender cámara'}</button>
          <form className="filtros" onSubmit={(e) => { e.preventDefault(); consultar(criterio); }}>
            <label className="visualmente-oculto" htmlFor="garita-criterio">Placa o código</label>
            <input id="garita-criterio" value={criterio} onChange={(e) => setCriterio(e.target.value)} placeholder="Placa (ABC-123) o código (EST-00018)" autoComplete="off" />
            <button className="btn" type="submit">Consultar</button>
          </form>
          {salidas.length > 0 && (
            <>
              <h2>Salidas de este turno ({salidas.length})</h2>
              <ul className="lista-simple">{salidas.map((s, i) => <li key={i}><strong>{s.placa}</strong> · {s.codigo} · {s.hora}</li>)}</ul>
            </>
          )}
        </section>
        <section aria-live="polite">
          <Barrera abierta={barrera.abierta} placa={barrera.placa} />
          {!resultado && <p className="vacio">Escanea un QR o escribe una placa para consultar.</p>}
          {resultado?.filas === null && <p className="carga">Consultando…</p>}
          {resultado?.error && <p className="caja-error">{resultado.error}</p>}
          {resultado?.filas?.length === 0 && !resultado.error && <p className="caja-error">No se encontró ninguna reserva con «{resultado.criterio}».</p>}
          {resultado?.filas?.map((r) => {
            const v = veredicto(r);
            return (
              <article key={r.id} className={`pase pase-${v.clase}`}>
                <h2>{v.texto}</h2>
                <dl className="datos">
                  <div className="dato"><dt>Placa</dt><dd>{r.placa}</dd></div>
                  <div className="dato"><dt>Reserva</dt><dd>{r.codigo}{r.tipo === 'bus' && ' (bus)'}</dd></div>
                  <div className="dato"><dt>Cliente</dt><dd>{r.cliente}</dd></div>
                  <div className="dato"><dt>Ingreso</dt><dd>{fechaHora(r.fecha_hora_entrada)} · {r.horas} h</dd></div>
                  {r.zona && <div className="dato"><dt>Zona</dt><dd>{r.zona}</dd></div>}
                  {r.pasaje_codigo && <div className="dato"><dt>Pasaje</dt><dd>{r.pasaje_codigo}</dd></div>}
                  <div className="dato"><dt>Estado</dt><dd><Estado valor={r.estado} /></dd></div>
                </dl>
                <div className="acciones">
                  {v.puede && <button type="button" className="btn btn-aero" onClick={() => registrarSalida(r)}>Registrar salida y abrir barrera</button>}
                  {r.estado === 'registrado' && <Link className="btn btn-borde" to={`/app/caja?buscar=${r.codigo}`}>Enviar a caja</Link>}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </Pagina>
  );
}
