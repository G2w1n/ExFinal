// src/modulos/transandino/FormViaje.jsx
// Formulario compartido de Comprar y Editar pasaje: ruta, fecha, asiento y equipaje con precio en vivo
import { useEffect, useState } from 'react';
import { pasajesApi } from '../../api/servicios.api.js';
import { Desglose } from '../../components/Desglose.jsx';
import { hoyEnLima } from '../../utils/formato.js';
import { MapaAsientos } from './MapaAsientos.jsx';
import { Calendario } from './Calendario.jsx';
import { FotoDestino } from '../../components/FotoDestino.jsx';

export function FormViaje({ viaje, setViaje, propio = null }) {
  const [rutas, setRutas] = useState([]);
  const [ocupados, setOcupados] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);

  useEffect(() => { pasajesApi.rutas().then(setRutas).catch(() => setRutas([])); }, []);

  // Asientos vendidos de ese viaje (sin contar el del propio pasaje al editar)
  useEffect(() => {
    if (!viaje.id_ruta || !viaje.fecha) return;
    pasajesApi.asientos(viaje.id_ruta, viaje.fecha)
      .then((r) => setOcupados(r.ocupados.filter((n) => !(propio && n === propio.asiento && String(propio.id_ruta) === String(viaje.id_ruta) && propio.fecha === viaje.fecha))))
      .catch(() => setOcupados([]));
  }, [viaje.id_ruta, viaje.fecha, propio]);

  // El precio lo calcula el servidor
  useEffect(() => {
    if (!viaje.asiento) { setCotizacion(null); return undefined; }
    const t = setTimeout(() => pasajesApi.cotizar({ asiento: viaje.asiento, equipaje_kg: viaje.equipaje_kg }).then(setCotizacion).catch(() => {}), 250);
    return () => clearTimeout(t);
  }, [viaje.asiento, viaje.equipaje_kg]);

  const ruta = rutas.find((r) => String(r.id) === String(viaje.id_ruta));
  return (
    <div className="form-viaje">
      <div className="fila-3">
        <label>Ruta
          <select value={viaje.id_ruta} onChange={(e) => setViaje({ ...viaje, id_ruta: e.target.value, asiento: null })} required>
            <option value="">Elige la ruta</option>
            {rutas.map((r) => <option key={r.id} value={r.id}>{r.origen} → {r.destino}</option>)}
          </select>
        </label>
        <label>Fecha de viaje
          <input type="date" min={hoyEnLima()} value={viaje.fecha} onChange={(e) => setViaje({ ...viaje, fecha: e.target.value, asiento: null })} required />
          <small>O elígela en el calendario.</small>
        </label>
        <label>Equipaje (kg)
          <input type="number" min="0" max="100" step="1" value={viaje.equipaje_kg} onChange={(e) => setViaje({ ...viaje, equipaje_kg: e.target.value })} />
          <small>20 kg incluidos; S/ 4 por kg extra.</small>
        </label>
      </div>
      {ruta && <FotoDestino ruta={ruta} />}
      {viaje.id_ruta && <Calendario idRuta={viaje.id_ruta} valor={viaje.fecha} onCambiar={(fecha) => setViaje({ ...viaje, fecha, asiento: null })} />}
      {ruta && <p className="dato-ruta">Sale a las <strong>{ruta.hora_salida}</strong> · viaje de <strong>{ruta.duracion_horas} h</strong></p>}
      {viaje.id_ruta && viaje.fecha && <MapaAsientos ocupados={ocupados} elegido={viaje.asiento} onElegir={(n) => setViaje({ ...viaje, asiento: n })} />}
      <Desglose cotizacion={cotizacion} />
    </div>
  );
}
