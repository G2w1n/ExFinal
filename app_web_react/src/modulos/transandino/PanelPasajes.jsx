// src/modulos/transandino/PanelPasajes.jsx
// Panel CRUD de TransAndino (administrador y empleado): buscar, cobrar, embarcar, editar, cancelar y eliminar
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { pasajesApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { DialogoPago } from '../../components/DialogoPago.jsx';
import { Estado } from '../../components/Estado.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { fechaHora, soles } from '../../utils/formato.js';

export function PanelPasajes() {
  const { tiene } = useAuth();
  const avisar = useAvisos();
  const esAdmin = tiene('transandino', 'administrador');
  const [filtros, setFiltros] = useState({ buscar: '', estado: '', fecha: '' });
  const [aplicados, setAplicados] = useState(filtros);
  const { datos, error, cargando, recargar } = useCarga(() => pasajesApi.listar(aplicados), [aplicados]);
  const [cobrando, setCobrando] = useState(null);

  const resumen = (datos ?? []).reduce((r, p) => ({ ...r, [p.estado]: (r[p.estado] ?? 0) + 1 }), {});

  async function accion(texto, fn, exito) {
    if (texto && !confirm(texto)) return;
    try {
      await fn();
      avisar(exito);
      recargar({ silencioso: true });
    } catch (err) {
      avisar(mensajeDeError(err), 'error');
    }
  }

  async function cobrar(metodo) {
    await pasajesApi.pagar(cobrando.id, metodo);
    avisar(`Cobrado · ${cobrando.codigo}`);
    setCobrando(null);
    recargar({ silencioso: true });
  }

  return (
    <Pagina modulo="transandino" titulo="Panel de pasajes"
      acciones={<Link className="btn btn-ta" to="/app/transandino/comprar">Venta presencial</Link>}>
      <div className="indicadores">
        {['registrado', 'pagado', 'abordado', 'cancelado'].map((e) => (
          <div key={e} className="indicador"><span>{e}</span><strong>{resumen[e] ?? 0}</strong></div>
        ))}
      </div>
      <form className="filtros" onSubmit={(e) => { e.preventDefault(); setAplicados(filtros); }}>
        <label className="visualmente-oculto" htmlFor="f-buscar">Buscar</label>
        <input id="f-buscar" type="search" placeholder="Código, cliente o correo" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })} />
        <label className="visualmente-oculto" htmlFor="f-estado">Estado</label>
        <select id="f-estado" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
          <option value="">Todos los estados</option>
          {['registrado', 'pagado', 'abordado', 'cancelado'].map((e) => <option key={e}>{e}</option>)}
        </select>
        <label className="visualmente-oculto" htmlFor="f-fecha">Fecha de salida</label>
        <input id="f-fecha" type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} />
        <button className="btn" type="submit">Filtrar</button>
      </form>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="No hay pasajes con esos filtros.">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Pasaje</th><th>Cliente</th><th>Ruta</th><th>Salida</th><th>Asiento</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {datos?.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.codigo}</strong>{p.reserva_codigo && <small className="enlazado">↔ {p.reserva_codigo}</small>}</td>
                  <td>{p.cliente}<small>{p.correo_cliente}</small></td>
                  <td>{p.origen} → {p.destino}</td>
                  <td>{fechaHora(p.fecha_salida)}</td>
                  <td>{p.asiento} <small>{p.tipo_asiento}</small></td>
                  <td>{soles(p.precio)}</td>
                  <td><Estado valor={p.estado} /></td>
                  <td className="celda-acciones">
                    {p.estado === 'registrado' && <button type="button" className="btn-fila" onClick={() => setCobrando(p)}>Cobrar</button>}
                    {p.estado === 'registrado' && <Link className="btn-fila" to={`/app/transandino/pasajes/${p.id}/editar`}>Editar</Link>}
                    {p.estado === 'pagado' && (
                      <button type="button" className="btn-fila" onClick={() => accion(null, () => pasajesApi.estado(p.id, 'abordado'), `${p.codigo}: abordó`)}>Abordó</button>
                    )}
                    {['registrado', 'pagado'].includes(p.estado) && (
                      <button type="button" className="btn-fila peligro" onClick={() => accion(`¿Cancelar ${p.codigo}?`, () => pasajesApi.estado(p.id, 'cancelado'), `${p.codigo} cancelado`)}>Cancelar</button>
                    )}
                    {esAdmin && ['registrado', 'cancelado'].includes(p.estado) && (
                      <button type="button" className="btn-fila peligro" onClick={() => accion(`¿Eliminar ${p.codigo}? No se puede deshacer.`, () => pasajesApi.eliminar(p.id), `${p.codigo} eliminado`)}>Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carga>
      {cobrando && (
        <DialogoPago abierto permitirEfectivo concepto={`Pasaje ${cobrando.codigo} · ${cobrando.cliente}`} monto={cobrando.precio}
          onPagar={cobrar} onCerrar={() => setCobrando(null)} />
      )}
    </Pagina>
  );
}
