// src/pages/Inicio.jsx
// Portada pública común: TransAndino + Aeropuerto en un solo sitio
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pasajesApi } from '../api/servicios.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hoyEnLima, soles } from '../utils/formato.js';

const PASOS = [
  ['1', 'Compra tu pasaje', 'Elige la ruta a Cusco, tu asiento y tu equipaje con TransAndino.'],
  ['2', 'Reserva tu estacionamiento', 'Con un clic: la fecha y la hora de llegada ya vienen llenas.'],
  ['3', 'Míralo todo junto', 'En «Mis viajes» ves tu pasaje y tu reserva con su estado.'],
];

export function Inicio() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const [rutas, setRutas] = useState([]);
  const [busqueda, setBusqueda] = useState({ id_ruta: '', fecha: hoyEnLima() });

  useEffect(() => {
    document.title = 'Viaje a Cusco · Grupo 15';
    pasajesApi.rutas().then((r) => {
      setRutas(r);
      setBusqueda((b) => ({ ...b, id_ruta: String(r.find((x) => x.destino === 'Cusco')?.id ?? r[0]?.id ?? '') }));
    }).catch(() => setRutas([]));
  }, []);

  function buscar(e) {
    e.preventDefault();
    const destino = `/app/transandino/comprar?ruta=${busqueda.id_ruta}&fecha=${busqueda.fecha}`;
    navegar(usuario ? destino : '/login', { state: { desde: destino } });
  }

  return (
    <div className="publico">
      <header className="barra barra-publica">
        <Link to="/" className="marca">Viaje a Cusco <small>Grupo 15</small></Link>
        <nav aria-label="Principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#rutas">Rutas</a>
          <a href="#estacionamiento">Estacionamiento</a>
          {usuario
            ? <Link className="btn btn-claro" to="/app">Ir a mi cuenta</Link>
            : <Link className="btn btn-claro" to="/login">Iniciar sesión</Link>}
        </nav>
      </header>

      <main id="contenido">
        <section className="portada">
          <div className="portada-texto">
            <p className="kicker">TransAndino Perú + Aeropuerto Internacional del Cusco</p>
            <h1>Tu pasaje y tu estacionamiento, en un solo paso</h1>
            <p className="lede">Compra tu pasaje a Cusco y deja reservado el estacionamiento del aeropuerto con la misma cuenta.</p>
            <form className="buscador" onSubmit={buscar}>
              <label>Ruta
                <select value={busqueda.id_ruta} onChange={(e) => setBusqueda({ ...busqueda, id_ruta: e.target.value })} required>
                  {rutas.map((r) => <option key={r.id} value={r.id}>{r.origen} → {r.destino}</option>)}
                </select>
              </label>
              <label>Fecha de viaje
                <input type="date" min={hoyEnLima()} value={busqueda.fecha} onChange={(e) => setBusqueda({ ...busqueda, fecha: e.target.value })} required />
              </label>
              <button className="btn btn-acento" type="submit">Buscar viaje</button>
            </form>
          </div>
        </section>

        <section id="como-funciona" className="bloque">
          <h2>Cómo funciona</h2>
          <ol className="pasos">
            {PASOS.map(([n, t, d]) => <li key={n}><span className="paso-n" aria-hidden="true">{n}</span><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </section>

        <section className="bloque dos-apps">
          <article className="tarjeta-app app-ta">
            <img src="/img/buses.webp" alt="Buses de TransAndino en el terminal" width="800" height="533" loading="lazy" />
            <div>
              <p className="etiqueta-app">TransAndino</p>
              <h2>Pasajes en bus</h2>
              <p>Asientos cama (1.er piso) y semicama (2.º piso), 20 kg de equipaje incluidos y monitoreo GPS en ruta.</p>
              <Link className="btn btn-ta" to={usuario ? '/app/transandino/comprar' : '/login'}>Comprar pasaje</Link>
            </div>
          </article>
          <article className="tarjeta-app app-aero" id="estacionamiento">
            <img src="/img/aeropuerto.webp" alt="Terminal del Aeropuerto Internacional del Cusco" width="1600" height="480" loading="lazy" />
            <div>
              <p className="etiqueta-app">Aeropuerto Cusco</p>
              <h2>Estacionamiento</h2>
              <p>S/ 7 por hora, tope de S/ 60 por día, tarifa nocturna de S/ 20 y 10 % menos el fin de semana. Zona techada VIP.</p>
              <Link className="btn btn-aero" to={usuario ? '/app/aeropuerto/reservar' : '/login'}>Reservar estacionamiento</Link>
            </div>
          </article>
        </section>

        <section id="rutas" className="bloque">
          <h2>Rutas y horarios</h2>
          <div className="tabla-scroll">
            <table className="tabla">
              <caption className="visualmente-oculto">Rutas de TransAndino</caption>
              <thead><tr><th>Ruta</th><th>Sale</th><th>Duración</th><th>Desde</th></tr></thead>
              <tbody>
                {rutas.map((r) => (
                  <tr key={r.id}><td>{r.origen} → {r.destino}</td><td>{r.hora_salida}</td><td>{r.duracion_horas} h</td><td>{soles(60)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="pie">
        <p><strong>Grupo 15 · Viaje a Cusco</strong> — Diseño Web, trabajo final. Caso académico ficticio.</p>
        <p>TransAndino Perú: Pérez Huamani, Julius Axl Nicolai · Aeropuerto Internacional del Cusco: Mueras Villanueva, Jefferson Percy</p>
      </footer>
    </div>
  );
}
