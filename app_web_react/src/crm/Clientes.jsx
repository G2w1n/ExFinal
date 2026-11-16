// src/crm/Clientes.jsx
// CRM: lista de clientes de las dos apps con su tipo (frecuente, nuevo, regular, inactivo)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { crmApi } from '../api/servicios.api.js';
import { Carga } from '../components/Carga.jsx';
import { Estado } from '../components/Estado.jsx';
import { Pagina } from '../components/Pagina.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { momento, soles } from '../utils/formato.js';

export function Clientes() {
  const [filtros, setFiltros] = useState({ buscar: '', segmento: '' });
  const [aplicados, setAplicados] = useState(filtros);
  const { datos, error, cargando, recargar } = useCarga(() => crmApi.clientes(aplicados), [aplicados]);
  return (
    <Pagina modulo="crm" titulo="Clientes" intro="Cada cliente con sus pasajes de TransAndino y sus reservas del aeropuerto.">
      <form className="filtros" onSubmit={(e) => { e.preventDefault(); setAplicados(filtros); }}>
        <label className="visualmente-oculto" htmlFor="c-buscar">Buscar</label>
        <input id="c-buscar" type="search" placeholder="Nombre o correo" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })} />
        <label className="visualmente-oculto" htmlFor="c-seg">Tipo de cliente</label>
        <select id="c-seg" value={filtros.segmento} onChange={(e) => setFiltros({ ...filtros, segmento: e.target.value })}>
          <option value="">Todos los tipos</option>
          {['frecuente', 'nuevo', 'regular', 'inactivo'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn" type="submit">Filtrar</button>
      </form>
      <Carga cargando={cargando} error={error} reintentar={recargar} vacio={datos?.length === 0} textoVacio="No hay clientes con esos filtros.">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead><tr><th>Cliente</th><th>Tipo</th><th>Pasajes</th><th>Reservas</th><th>Pendientes</th><th>Gastado</th><th>Última actividad</th><th><span className="visualmente-oculto">Ficha</span></th></tr></thead>
            <tbody>
              {datos?.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong><small>{c.correo}</small></td>
                  <td><Estado valor={c.segmento} /></td>
                  <td>{c.pasajes}</td><td>{c.reservas}</td><td>{c.pendientes}</td>
                  <td>{soles(c.gastado)}</td><td>{momento(c.ultima_actividad)}</td>
                  <td><Link className="btn-fila" to={`/app/crm/clientes/${c.id}`}>Ver ficha</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carga>
    </Pagina>
  );
}
