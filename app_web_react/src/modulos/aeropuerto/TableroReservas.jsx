// src/modulos/aeropuerto/TableroReservas.jsx
// Tablero tipo Trello: el personal arrastra cada reserva a su siguiente estado
// (también con los botones de cada tarjeta, para usarlo con teclado).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mensajeDeError } from '../../api/client.js';
import { reservasApi } from '../../api/servicios.api.js';
import { Carga } from '../../components/Carga.jsx';
import { Pagina } from '../../components/Pagina.jsx';
import { useAvisos } from '../../context/AvisosContext.jsx';
import { useCarga } from '../../hooks/useCarga.js';
import { fechaHora, soles } from '../../utils/formato.js';

const COLUMNAS = [
  { estado: 'registrado', titulo: 'Por pagar', ayuda: 'Se cobran en caja' },
  { estado: 'pagado', titulo: 'Pagadas' },
  { estado: 'preparado', titulo: 'Espacio listo' },
  { estado: 'finalizado', titulo: 'Salió' },
];
// A qué columnas se puede mover cada estado (las mismas reglas que la API)
const PERMITIDO = { pagado: ['preparado', 'finalizado'], preparado: ['finalizado'] };

export function TableroReservas() {
  const avisar = useAvisos();
  const { datos, error, cargando, recargar, setDatos } = useCarga(() => reservasApi.listar({}), [], { cadaSegundos: 20 });
  const [arrastrando, setArrastrando] = useState(null);
  const [sobre, setSobre] = useState(null);

  const visibles = (datos ?? []).filter((r) => r.estado !== 'cancelado')
    .sort((a, b) => a.fecha_hora_entrada.localeCompare(b.fecha_hora_entrada));

  async function mover(r, estado) {
    if (!PERMITIDO[r.estado]?.includes(estado)) {
      if (r.estado !== estado) avisar(r.estado === 'registrado' ? `${r.codigo}: primero se cobra en caja.` : `${r.codigo} no puede pasar a «${estado}».`, 'error');
      return;
    }
    const anterior = datos;
    setDatos(datos.map((x) => (x.id === r.id ? { ...x, estado } : x))); // se mueve al instante
    try {
      await reservasApi.estado(r.id, estado);
      avisar(`${r.codigo} → ${COLUMNAS.find((c) => c.estado === estado).titulo}`);
    } catch (err) {
      setDatos(anterior);
      avisar(mensajeDeError(err), 'error');
    }
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Tablero de reservas" intro="Arrastra cada reserva a su siguiente estado. Se actualiza solo cada 20 segundos.">
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        <div className="kanban">
          {COLUMNAS.map((col) => {
            const tarjetas = visibles.filter((r) => r.estado === col.estado);
            const valida = arrastrando && PERMITIDO[arrastrando.estado]?.includes(col.estado);
            return (
              <section key={col.estado} className={`kanban-col col-${col.estado} ${sobre === col.estado ? (valida ? 'sobre-ok' : 'sobre-no') : ''}`}
                aria-label={col.titulo}
                onDragOver={(e) => { e.preventDefault(); setSobre(col.estado); }}
                onDragLeave={() => setSobre(null)}
                onDrop={(e) => { e.preventDefault(); setSobre(null); if (arrastrando) mover(arrastrando, col.estado); setArrastrando(null); }}>
                <h2>{col.titulo} <span className="contador-col">{tarjetas.length}</span></h2>
                {col.ayuda && <p className="nota">{col.ayuda}</p>}
                <ul>
                  {tarjetas.map((r) => (
                    <li key={r.id} className={`kanban-tarjeta ${arrastrando?.id === r.id ? 'levantada' : ''}`} draggable={Boolean(PERMITIDO[r.estado])}
                      onDragStart={() => setArrastrando(r)} onDragEnd={() => { setArrastrando(null); setSobre(null); }}>
                      <p className="kanban-cab"><strong>{r.codigo}</strong>{r.tipo === 'bus' && <span className="chip-bus">bus</span>}</p>
                      <p>{r.placa} · {r.cliente}</p>
                      <p className="nota">{fechaHora(r.fecha_hora_entrada)} · {r.horas} h · {soles(r.monto)}</p>
                      {r.pasaje_codigo && <p className="enlazado">↔ {r.pasaje_codigo}</p>}
                      <div className="kanban-acciones">
                        {r.estado === 'registrado' && <Link className="btn-fila" to={`/app/caja?buscar=${r.codigo}`}>Cobrar en caja</Link>}
                        {(PERMITIDO[r.estado] ?? []).map((destino) => (
                          <button key={destino} type="button" className="btn-fila" onClick={() => mover(r, destino)}>
                            → {COLUMNAS.find((c) => c.estado === destino).titulo}
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                  {tarjetas.length === 0 && <li className="kanban-vacia">Sin reservas</li>}
                </ul>
              </section>
            );
          })}
        </div>
      </Carga>
    </Pagina>
  );
}
