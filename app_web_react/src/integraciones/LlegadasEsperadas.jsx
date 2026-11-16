// src/integraciones/LlegadasEsperadas.jsx
// Integración 3 (HU-15.3): reservas + pasajes ordenadas por la hora de llegada del bus (JOIN en la API)
import { useState } from 'react';
import { mensajeDeError } from '../api/client.js';
import { integracionesApi, reservasApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Estado } from '../components/Estado.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useAvisos } from '../context/AvisosContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { fechaHora, hora, hoyEnLima } from '../utils/formato.js';

export function LlegadasEsperadas() {
  const avisar = useAvisos();
  const [fecha, setFecha] = useState(hoyEnLima());
  const { datos, error, cargando, recargar } = useCarga(() => integracionesApi.llegadas(fecha), [fecha], { cadaSegundos: 15 });

  async function preparar(l) {
    try {
      await reservasApi.estado(l.id, 'preparado');
      avisar(`Espacio listo para ${l.pasaje_codigo} · ${l.placa}`);
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    }
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Llegadas esperadas" intro="Pasajeros de TransAndino que llegan con reserva de estacionamiento, por hora de llegada del bus."
      acciones={(
        <label className="campo-linea">Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
      )}>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="No hay llegadas con reserva en esa fecha.">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Llega</th><th>Pasaje</th><th>Pasajero</th><th>Desde</th><th>Placa</th><th>Ingreso</th><th>Estado</th><th><span className="visualmente-oculto">Acción</span></th></tr></thead>
            <tbody>
              {datos?.map((l) => (
                <tr key={l.id}>
                  <td className="hora-grande">{hora(l.hora_llegada)}</td>
                  <td>{l.pasaje_codigo}<small><Estado valor={l.pasaje_estado} /></small></td>
                  <td>{l.cliente}</td>
                  <td>{l.origen}</td>
                  <td>{l.placa}{l.zona_vip && <small>VIP</small>}</td>
                  <td>{fechaHora(l.fecha_hora_entrada)} · {l.horas} h</td>
                  <td><Estado valor={l.estado} /></td>
                  <td>{l.estado === 'pagado' && <button type="button" className="btn-fila" onClick={() => preparar(l)}>Preparar espacio</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carga>
    </Pagina>
  );
}
