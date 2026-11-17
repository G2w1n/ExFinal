// src/pages/Estacionamiento.jsx
// Mapa de espacios libres y ocupados (traído del Parcial): las reservas reales de la base de datos
// más los vehículos que llegan sin reserva (simulado). Tarifas y calculadora con el precio del servidor.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservasApi } from '../api/servicios.api.js';
import { Desglose } from '../components/Desglose.jsx';
import { CabeceraPublica, PiePublico } from '../components/Publico.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCarga } from '../hooks/useCarga.js';
import { dentroDe } from '../utils/formato.js';
import { ahoraEnLima, aHora } from '../vuelos/datosVuelos.js';

const ZONAS = [
  { clave: 'normal', nombre: 'Zona general', prefijo: 'A' },
  { clave: 'vip', nombre: 'Zona techada VIP', prefijo: 'V' },
  { clave: 'bus', nombre: 'Buses y camiones', prefijo: 'B' },
];

function azar(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

// Vehículos sin reserva (SIMULADO): más llenos a media mañana y al final de la tarde
function sinReserva(zona, capacidad, momento) {
  const hora = Math.floor(momento.minutos / 60);
  const curva = Math.max(Math.exp(-((hora - 11) ** 2) / 8), Math.exp(-((hora - 18) ** 2) / 6));
  const base = zona === 'vip' ? 0.2 : zona === 'bus' ? 0.15 : 0.3;
  return Math.round(capacidad * Math.min(0.85, base + 0.45 * curva + azar(`${momento.dia}|${hora}|${zona}`) * 0.1));
}

// Qué espacios se pintan: primero los de reservas en línea, luego los simulados; iguales durante la hora
function repartir(zona, capacidad, conReserva, simulados, momento) {
  const hora = Math.floor(momento.minutos / 60);
  const orden = Array.from({ length: capacidad }, (_, i) => i)
    .sort((a, b) => azar(`${momento.dia}|${hora}|${zona}|${a}`) - azar(`${momento.dia}|${hora}|${zona}|${b}`));
  const estado = Array(capacidad).fill('libre');
  orden.slice(0, conReserva).forEach((i) => { estado[i] = 'reservado'; });
  orden.slice(conReserva, Math.min(capacidad, conReserva + simulados)).forEach((i) => { estado[i] = 'ocupado'; });
  return estado;
}

export function Estacionamiento() {
  const { usuario } = useAuth();
  const { datos, error } = useCarga(() => reservasApi.ocupacion(), [], { cadaSegundos: 60 });
  const [momento, setMomento] = useState(() => ahoraEnLima());
  const [calc, setCalc] = useState({ fecha_hora_entrada: dentroDe(2).slice(0, 14) + '00', horas: 6, tipo: 'auto', zona_vip: false });
  const [cotizacion, setCotizacion] = useState(null);

  useEffect(() => { document.title = 'Estacionamiento · Aeropuerto Cusco'; }, []);
  useEffect(() => { const t = setInterval(() => setMomento(ahoraEnLima()), 60000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const t = setTimeout(() => reservasApi.cotizar(calc).then(setCotizacion).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [calc]);

  const zonas = useMemo(() => ZONAS.map((z) => {
    const capacidad = datos?.capacidad?.[z.clave] ?? { normal: 60, vip: 20, bus: 8 }[z.clave];
    const conReserva = Math.min(capacidad, datos?.reservas?.[z.clave]?.ahora ?? 0);
    const simulados = sinReserva(z.clave, capacidad, momento);
    const espacios = repartir(z.clave, capacidad, conReserva, simulados, momento);
    const libres = espacios.filter((e) => e === 'libre').length;
    return { ...z, capacidad, espacios, libres, llegan: datos?.reservas?.[z.clave]?.llegan ?? 0 };
  }), [datos, momento]);

  return (
    <div className="publico">
      <CabeceraPublica />
      <main id="contenido">
        <section className="portada portada-corta">
          <div className="portada-texto">
            <p className="kicker">Aeropuerto Internacional del Cusco · a 50 m del terminal</p>
            <h1>Estacionamiento</h1>
            <p className="lede">Abierto las 24 horas, con vigilancia y zona techada VIP. Reserva en línea y paga antes de llegar.</p>
            <div className="contadores" aria-live="polite">
              {zonas.map((z) => (
                <div key={z.clave} className={`contador ${z.libres <= z.capacidad * 0.1 ? 'casi-lleno' : ''}`}>
                  <strong>{z.libres}</strong><span>{z.nombre}</span>
                  <span className="contador-barra"><span style={{ width: `${((z.capacidad - z.libres) / z.capacidad) * 100}%` }} /></span>
                </div>
              ))}
            </div>
            <p className="actualizado">Espacios libres a las {aHora(momento.minutos)} (hora de Cusco)</p>
          </div>
        </section>

        <section className="bloque" aria-labelledby="t-mapa">
          <div className="cabecera-mapa">
            <h2 id="t-mapa">Mapa de espacios</h2>
            <ul className="leyenda-mapa">
              <li><span className="muestra-esp libre" /> Libre</li>
              <li><span className="muestra-esp reservado" /> Reserva en línea</li>
              <li><span className="muestra-esp ocupado" /> Ocupado sin reserva (simulado)</li>
            </ul>
          </div>
          {error && <p className="caja-error">No se pudieron leer las reservas: el mapa muestra solo la ocupación simulada.</p>}
          <div className="mapa-playa">
            {zonas.map((z) => (
              <div key={z.clave} className={`zona zona-${z.clave}`}>
                <h3>{z.nombre} <span>{z.libres} libres de {z.capacidad}{z.llegan ? ` · ${z.llegan} llegan en 2 h` : ''}</span></h3>
                <div className="espacios" role="img" aria-label={`${z.nombre}: ${z.libres} espacios libres de ${z.capacidad}`}>
                  {z.espacios.map((estado, i) => (
                    <span key={i} className={`espacio ${estado}`} aria-hidden="true">{z.prefijo}{String(i + 1).padStart(2, '0')}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bloque calc-grid" aria-labelledby="t-calc">
          <div>
            <h2 id="t-calc">¿Cuánto pagaré?</h2>
            <p className="intro">S/ 7 por hora o fracción · tope de S/ 60 por día · nocturna S/ 20 (de 22:00 a 06:00, hasta 8 h) · 10 % menos el fin de semana · bus +50 % · VIP + S/ 15.</p>
            <div className="tarjeta formulario">
              <div className="fila-2">
                <label>Entrada<input type="datetime-local" value={calc.fecha_hora_entrada} onChange={(e) => setCalc({ ...calc, fecha_hora_entrada: e.target.value })} /></label>
                <label>Horas<input type="number" min="1" max="240" value={calc.horas} onChange={(e) => setCalc({ ...calc, horas: e.target.value })} /></label>
                <label>Vehículo
                  <select value={calc.tipo} onChange={(e) => setCalc({ ...calc, tipo: e.target.value, zona_vip: e.target.value === 'bus' ? false : calc.zona_vip })}>
                    <option value="auto">Auto, camioneta o moto</option><option value="bus">Bus o camión</option>
                  </select>
                </label>
              </div>
              {calc.tipo === 'auto' && <label className="check"><input type="checkbox" checked={calc.zona_vip} onChange={(e) => setCalc({ ...calc, zona_vip: e.target.checked })} /> Zona techada VIP</label>}
            </div>
          </div>
          <div className="calc-resultado">
            <Desglose cotizacion={cotizacion} />
            <Link className="btn btn-aero" to={usuario ? '/app/aeropuerto/reservar' : '/login'}>Reservar con este precio</Link>
          </div>
        </section>
      </main>
      <PiePublico />
    </div>
  );
}
