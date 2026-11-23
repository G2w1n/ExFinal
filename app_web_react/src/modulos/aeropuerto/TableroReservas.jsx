// src/modulos/aeropuerto/TableroReservas.jsx
// Tablero tipo Trello con dnd-kit: se arrastra con el mouse, el dedo o el teclado
// (Tab hasta la tarjeta, Espacio para levantarla, flechas para moverla, Espacio para soltarla).
// Framer Motion anima el reacomodo de las tarjetas. Las reglas de estado son las mismas que la API.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
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
const PERMITIDO = { pagado: ['preparado', 'finalizado'], preparado: ['finalizado'] };
const tituloDe = (estado) => COLUMNAS.find((c) => c.estado === estado).titulo;

function Tarjeta({ r, flotando = false }) {
  return (
    <>
      <p className="kanban-cab"><strong>{r.codigo}</strong>{r.tipo === 'bus' && <span className="chip-bus">bus</span>}</p>
      <p>{r.placa} · {r.cliente}</p>
      <p className="nota">{fechaHora(r.fecha_hora_entrada)} · {r.horas} h · {soles(r.monto)}</p>
      {r.pasaje_codigo && <p className="enlazado">↔ {r.pasaje_codigo}</p>}
      {flotando && <p className="nota">Suelta en otra columna…</p>}
    </>
  );
}

function TarjetaArrastrable({ r, mover }) {
  const puede = Boolean(PERMITIDO[r.estado]);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: r.id, data: r, disabled: !puede });
  return (
    <motion.li layout layoutId={`reserva-${r.id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: isDragging ? 0.35 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }} className="kanban-tarjeta">
      <div ref={setNodeRef} {...(puede ? { ...attributes, ...listeners } : {})} className={puede ? 'asa' : undefined}
        aria-label={puede ? `${r.codigo}: arrastra para cambiar de estado` : undefined}>
        <Tarjeta r={r} />
      </div>
      <div className="kanban-acciones">
        {r.estado === 'registrado' && <Link className="btn-fila" to={`/app/caja?buscar=${r.codigo}`}>Cobrar en caja</Link>}
        {(PERMITIDO[r.estado] ?? []).map((destino) => (
          <button key={destino} type="button" className="btn-fila" onClick={() => mover(r, destino)}>→ {tituloDe(destino)}</button>
        ))}
      </div>
    </motion.li>
  );
}

function Columna({ col, tarjetas, activa, mover }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.estado });
  const valida = activa && PERMITIDO[activa.estado]?.includes(col.estado);
  return (
    <section ref={setNodeRef} className={`kanban-col col-${col.estado} ${isOver ? (valida ? 'sobre-ok' : 'sobre-no') : ''} ${activa && valida ? 'destino-posible' : ''}`} aria-label={col.titulo}>
      <h2>{col.titulo} <motion.span key={tarjetas.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="contador-col">{tarjetas.length}</motion.span></h2>
      {col.ayuda && <p className="nota">{col.ayuda}</p>}
      <ul>
        <AnimatePresence initial={false}>
          {tarjetas.map((r) => <TarjetaArrastrable key={r.id} r={r} mover={mover} />)}
        </AnimatePresence>
        {tarjetas.length === 0 && <li className="kanban-vacia">Sin reservas</li>}
      </ul>
    </section>
  );
}

export function TableroReservas() {
  const avisar = useAvisos();
  const { datos, error, cargando, recargar, setDatos } = useCarga(() => reservasApi.listar({}), [], { cadaSegundos: 30 });
  const [activa, setActiva] = useState(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const visibles = (datos ?? []).filter((r) => r.estado !== 'cancelado')
    .sort((a, b) => a.fecha_hora_entrada.localeCompare(b.fecha_hora_entrada));

  async function mover(r, estado) {
    if (r.estado === estado) return;
    if (!PERMITIDO[r.estado]?.includes(estado)) {
      avisar(r.estado === 'registrado' ? `${r.codigo}: primero se cobra en caja.` : `${r.codigo} no puede pasar a «${tituloDe(estado)}».`, 'error');
      return;
    }
    const anterior = datos;
    setDatos((lista) => lista.map((x) => (x.id === r.id ? { ...x, estado } : x))); // se mueve al instante
    try {
      await reservasApi.estado(r.id, estado);
      avisar(`${r.codigo} → ${tituloDe(estado)}`);
    } catch (err) {
      setDatos(anterior);
      avisar(mensajeDeError(err), 'error');
    }
  }

  return (
    <Pagina modulo="aeropuerto" titulo="Tablero de reservas" intro="Arrastra cada reserva a su siguiente estado (mouse, dedo o teclado). Se actualiza en vivo.">
      <Carga cargando={cargando} error={error} reintentar={recargar}>
        <DndContext sensors={sensores} collisionDetection={closestCorners}
          onDragStart={({ active }) => setActiva(active.data.current)}
          onDragCancel={() => setActiva(null)}
          onDragEnd={({ active, over }) => { setActiva(null); if (over) mover(active.data.current, over.id); }}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `Levantaste ${active.data.current.codigo}.`,
              onDragOver: ({ over }) => (over ? `Sobre la columna ${tituloDe(over.id)}.` : 'Fuera de las columnas.'),
              onDragEnd: ({ active, over }) => (over ? `${active.data.current.codigo} soltada en ${tituloDe(over.id)}.` : 'Se canceló.'),
              onDragCancel: () => 'Se canceló el movimiento.',
            },
          }}>
          <div className="kanban">
            {COLUMNAS.map((col) => <Columna key={col.estado} col={col} tarjetas={visibles.filter((r) => r.estado === col.estado)} activa={activa} mover={mover} />)}
          </div>
          <DragOverlay dropAnimation={{ duration: 220 }}>
            {activa && <div className="kanban-tarjeta flotando"><Tarjeta r={activa} flotando /></div>}
          </DragOverlay>
        </DndContext>
      </Carga>
    </Pagina>
  );
}
