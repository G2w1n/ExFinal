// src/pages/Inicio.jsx
// Portada pública común: TransAndino + Aeropuerto en un solo sitio
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { imagenesApi, pasajesApi } from '../api/servicios.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { hoyEnLima, soles } from '../utils/formato.js';
import { CabeceraPublica, PiePublico } from '../components/Publico.jsx';
import { Tablero } from '../vuelos/Tablero.jsx';
import { Revelar } from '../components/Revelar.jsx';
import { Animacion } from '../components/Animacion.jsx';
import { useTranslation } from 'react-i18next';

const PASOS = [
  ['1', 'Compra tu pasaje', 'Elige la ruta a Cusco, tu asiento y tu equipaje con TransAndino.'],
  ['2', 'Reserva tu estacionamiento', 'Con un clic: la fecha y la hora de llegada ya vienen llenas.'],
  ['3', 'Míralo todo junto', 'En «Mis viajes» ves tu pasaje y tu reserva con su estado.'],
];

export function Inicio() {
  const { usuario } = useAuth();
  const navegar = useNavigate();
  const { hash } = useLocation();
  const { t } = useTranslation();
  const [rutas, setRutas] = useState([]);
  const [busqueda, setBusqueda] = useState({ id_ruta: '', fecha: hoyEnLima() });

  useEffect(() => {
    document.title = 'Viaje a Cusco · Grupo 15';
    pasajesApi.rutas().then((r) => {
      setRutas(r);
      setBusqueda((b) => ({ ...b, id_ruta: String(r.find((x) => x.destino === 'Cusco')?.id ?? r[0]?.id ?? '') }));
    }).catch(() => setRutas([]));
  }, []);

  // Los enlaces del menú público (/#rutas, /#servicios) bajan a su sección
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [hash]);

  function buscar(e) {
    e.preventDefault();
    const destino = `/app/transandino/comprar?ruta=${busqueda.id_ruta}&fecha=${busqueda.fecha}`;
    navegar(usuario ? destino : '/login', { state: { desde: destino } });
  }

  return (
    <div className="publico">
      <CabeceraPublica />

      <main id="contenido">
        <section className="portada">
          <Animacion nombre="avion" bucle className="portada-avion" />
          <div className="portada-texto">
            <p className="kicker">TransAndino Perú + Aeropuerto Internacional del Cusco</p>
            <h1>{t('portadaTitulo')}</h1>
            <p className="lede">{t('portadaLede')}</p>
            <form className="buscador" onSubmit={buscar}>
              <label>Ruta
                <select value={busqueda.id_ruta} onChange={(e) => setBusqueda({ ...busqueda, id_ruta: e.target.value })} required>
                  {rutas.map((r) => <option key={r.id} value={r.id}>{r.origen} → {r.destino}</option>)}
                </select>
              </label>
              <label>Fecha de viaje
                <input type="date" min={hoyEnLima()} value={busqueda.fecha} onChange={(e) => setBusqueda({ ...busqueda, fecha: e.target.value })} required />
              </label>
              <button className="btn btn-acento" type="submit">{t('Buscar viaje')}</button>
            </form>
          </div>
        </section>

        <Revelar as="section" id="como-funciona" className="bloque">
          <h2>{t('Cómo funciona')}</h2>
          <ol className="pasos">
            {PASOS.map(([n, t, d]) => <li key={n}><span className="paso-n" aria-hidden="true">{n}</span><h3>{t}</h3><p>{d}</p></li>)}
          </ol>
        </Revelar>

        <Revelar as="section" className="bloque dos-apps">
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
        </Revelar>

        <Revelar as="section" className="bloque" aria-label="Próximos vuelos">
          <div className="cabecera-seccion">
            <h2>{t('Próximos vuelos')}</h2>
            <Link to="/vuelos">Ver todos los vuelos →</Link>
          </div>
          <Tablero compacto limite={6} />
        </Revelar>

        <Revelar as="section" id="rutas" className="bloque">
          <h2>Rutas y horarios</h2>
          <div className="tabla-scroll">
            <table className="tabla">
              <caption className="visualmente-oculto">Rutas de TransAndino</caption>
              <thead><tr><th>Ruta</th><th>Sale</th><th>Duración</th><th>Desde</th></tr></thead>
              <tbody>
                {rutas.map((r) => (
                  <tr key={r.id}><td><span className="ruta-celda">{r.imagen_v && <img className="ruta-mini" src={imagenesApi.url('destino', r.id, r.imagen_v)} alt="" width="64" height="36" loading="lazy" />}{r.origen} → {r.destino}</span></td><td>{r.hora_salida}</td><td>{r.duracion_horas} h</td><td>{soles(60)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Revelar>

        <Revelar as="section" id="servicios" className="bloque">
          <h2>Servicios</h2>
          <div className="servicios">
            <article className="servicio app-ta"><img src="/img/asientos.webp" alt="Asientos reclinables del bus" width="900" height="599" loading="lazy" /><div><h3>Transporte interprovincial</h3><p>Buses de última generación con asientos reclinables y monitoreo GPS continuo.</p></div></article>
            <article className="servicio app-ta"><img src="/img/gps.webp" alt="Monitoreo GPS en tiempo real" width="700" height="420" loading="lazy" /><div><h3>Servicio VIP / ejecutivo</h3><p>Unidades panorámicas con snacks a bordo, WiFi, tomacorrientes en cada asiento y entretenimiento.</p></div></article>
            <article className="servicio app-aero"><div><h3>Estacionamiento 24 horas</h3><p>A 50 metros del terminal, con vigilancia, zona techada VIP y espacio para buses. <Link to="/estacionamiento">Ver espacios libres</Link></p></div></article>
            <article className="servicio app-aero"><div><h3>Vuelos en vivo</h3><p>Salidas y llegadas del aeropuerto con su estado y puerta. <Link to="/vuelos">Ver el tablero</Link></p></div></article>
          </div>
        </Revelar>

        <Revelar as="section" id="requisitos" className="bloque">
          <h2>Requisitos</h2>
          <div className="requisitos">
            <div className="tarjeta"><h3>Para viajar en bus</h3><ul>
              <li>DNI o pasaporte físico vigente al abordar.</li>
              <li>Pasaje impreso o en el celular.</li>
              <li>Llegar al terminal 30 minutos antes.</li>
              <li>Menores de edad: DNI físico y, si viajan solos o con un tercero, autorización notarial de los padres (norma del MTC).</li>
            </ul></div>
            <div className="tarjeta"><h3>Para el estacionamiento</h3><ul>
              <li>Reserva pagada: el código QR del comprobante es tu pase de salida.</li>
              <li>Si pagas en la caja, conserva tu comprobante.</li>
              <li>Si te quedas más de lo reservado, el exceso se paga en caja antes de salir.</li>
            </ul></div>
          </div>
        </Revelar>

        <Revelar as="section" id="ubicacion" className="bloque">
          <h2>Dónde estamos</h2>
          <div className="requisitos">
            <div className="tarjeta"><h3>TransAndino Perú</h3><ul>
              <li><strong>Sede central Lima:</strong> Av. Javier Prado Este 1120, La Victoria · (01) 456-7890 · de 06:00 a 23:00</li>
              <li><strong>Cusco:</strong> Av. El Sol 450 · (084) 567-890</li>
              <li><strong>Arequipa:</strong> Terminal Terrestre, stand 14 · (054) 890-123</li>
              <li><strong>Huancayo:</strong> Av. Ferrocarril 850 · (064) 234-567</li>
            </ul></div>
            <div className="tarjeta"><h3>Aeropuerto Internacional del Cusco</h3><ul>
              <li>Av. de la Aviación s/n, Cusco</li>
              <li>Estacionamiento abierto las 24 horas</li>
              <li>Informes: (084) 000-000</li>
            </ul></div>
          </div>
        </Revelar>
      </main>

      <PiePublico />
    </div>
  );
}
