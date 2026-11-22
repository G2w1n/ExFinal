// src/modulos/aeropuerto/PanelReservas.jsx
// Panel CRUD del Aeropuerto (administrador y empleado): cobrar, preparar espacio, asignar zona, salida, cancelar y eliminar
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { reservasApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { Numero } from '../../components/Numero.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { fechaHora, soles } from '../../utils/formato.js';

const ESTADOS = ['registrado', 'pagado', 'preparado', 'finalizado', 'cancelado'];

export function PanelReservas() {
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const esAdmin = tiene('aeropuerto', 'administrador');
  const [params] = useSearchParams();
  const [filtros, setFiltros] = useState({ buscar: params.get('buscar') ?? '', estado: '', tipo: '', fecha: '' });
  const [aplicados, setAplicados] = useState(filtros);
  const { datos, error, cargando, recargar } = useCarga(() => reservasApi.listar(aplicados), [aplicados], { cadaSegundos: 15 });
  const resumen = (datos ?? []).reduce((r, x) => ({ ...r, [x.estado]: (r[x.estado] ?? 0) + 1 }), {});

  async function accion(confirmar, fn, exito) {
    if (confirmar && !confirm(confirmar)) return;
    try {
      await fn();
      avisar(exito);
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    }
  }

  function asignarZona(r) {
    const zona = prompt(`Zona para ${r.codigo} (${r.placa}):`, r.zona ?? (r.tipo === 'bus' ? 'B' : 'A'));
    if (zona) accion(null, () => reservasApi.zona(r.id, zona), `Zona ${zona.toUpperCase()} asignada a ${r.codigo}`);
  }


  return (
    <Pagina modulo="aeropuerto" titulo="Panel de reservas" intro="Se actualiza solo cada 15 segundos."
      acciones={<Link className="btn btn-aero" to="/app/aeropuerto/llegadas">Llegadas esperadas</Link>}>
      <div className="indicadores">
        {ESTADOS.map((e) => <div key={e} className="indicador"><span>{e === 'preparado' ? 'espacio listo' : e}</span><strong><Numero valor={resumen[e] ?? 0} /></strong></div>)}
      </div>
      <form className="filtros" onSubmit={(e) => { e.preventDefault(); setAplicados(filtros); }}>
        <label className="visualmente-oculto" htmlFor="r-buscar">Buscar</label>
        <input id="r-buscar" type="search" placeholder="Código, placa o cliente" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })} />
        <label className="visualmente-oculto" htmlFor="r-estado">Estado</label>
        <select id="r-estado" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e}>{e}</option>)}
        </select>
        <label className="visualmente-oculto" htmlFor="r-tipo">Tipo</label>
        <select id="r-tipo" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Autos y buses</option><option value="auto">Autos</option><option value="bus">Buses</option>
        </select>
        <label className="visualmente-oculto" htmlFor="r-fecha">Fecha de ingreso</label>
        <input id="r-fecha" type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} />
        <button className="btn" type="submit">Filtrar</button>
      </form>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="No hay reservas con esos filtros.">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Reserva</th><th>Cliente</th><th>Placa</th><th>Ingreso</th><th>Horas</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {datos?.map((r) => (
                <tr key={r.id} className={r.tipo === 'bus' ? 'fila-bus' : undefined}>
                  <td><strong>{r.codigo}</strong>{r.tipo === 'bus' && <small className="chip-bus">bus</small>}{r.pasaje_codigo && <small className="enlazado">↔ {r.pasaje_codigo}</small>}</td>
                  <td>{r.cliente}<small>{r.nombre_pasajero}</small></td>
                  <td>{r.placa}{r.zona && <small>zona {r.zona}</small>}</td>
                  <td>{fechaHora(r.fecha_hora_entrada)}</td>
                  <td>{r.horas} h{r.zona_vip && <small>VIP</small>}</td>
                  <td>{soles(r.monto)}</td>
                  <td><Estado valor={r.estado} /></td>
                  <td className="celda-acciones">
                    {['pagado', 'preparado', 'finalizado'].includes(r.estado) && <Link className="btn-fila" to={`/app/comprobante/reserva/${r.id}`}>Comprobante</Link>}
                    {r.estado === 'registrado' && <Link className="btn-fila" to={`/app/caja?buscar=${r.codigo}`}>Cobrar en caja</Link>}
                    {r.estado === 'registrado' && <Link className="btn-fila" to={`/app/aeropuerto/reservas/${r.id}/editar`}>Editar</Link>}
                    {r.estado === 'pagado' && <button type="button" className="btn-fila" onClick={() => accion(null, () => reservasApi.estado(r.id, 'preparado'), `Espacio listo para ${r.codigo}`)}>Preparar espacio</button>}
                    {!['finalizado', 'cancelado'].includes(r.estado) && <button type="button" className="btn-fila" onClick={() => asignarZona(r)}>Zona</button>}
                    {['pagado', 'preparado'].includes(r.estado) && <button type="button" className="btn-fila" onClick={() => accion(`¿Registrar la salida de ${r.placa}?`, () => reservasApi.estado(r.id, 'finalizado'), `Salida registrada: ${r.placa}`)}>Salida</button>}
                    {!['finalizado', 'cancelado'].includes(r.estado) && <button type="button" className="btn-fila peligro" onClick={() => accion(`¿Cancelar ${r.codigo}?`, () => reservasApi.estado(r.id, 'cancelado'), `${r.codigo} cancelada`)}>Cancelar</button>}
                    {esAdmin && ['registrado', 'cancelado'].includes(r.estado) && <button type="button" className="btn-fila peligro" onClick={() => accion(`¿Eliminar ${r.codigo}? No se puede deshacer.`, () => reservasApi.eliminar(r.id), `${r.codigo} eliminada`)}>Eliminar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carga>
    </Pagina>
  );
}
