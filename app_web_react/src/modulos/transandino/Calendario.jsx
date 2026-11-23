// src/modulos/transandino/Calendario.jsx
// Calendario del viaje (React Day Picker): días pasados desactivados y cada día marcado
// según los asientos vendidos (pocos asientos / lleno).
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { pasajesApi } from '../../api/servicios.api.js';
import { hoyEnLima } from '../../utils/formato.js';

const aFecha = (texto) => { const [a, m, d] = texto.split('-').map(Number); return new Date(a, m - 1, d); };
const aTexto = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;

export function Calendario({ idRuta, valor, onCambiar }) {
  const [dias, setDias] = useState([]);
  useEffect(() => {
    if (!idRuta) return;
    pasajesApi.disponibilidad(idRuta, hoyEnLima()).then((r) => setDias(r.dias)).catch(() => setDias([]));
  }, [idRuta]);
  const lleno = dias.filter((d) => d.vendidos >= 40).map((d) => aFecha(d.fecha));
  const pocos = dias.filter((d) => d.vendidos >= 30 && d.vendidos < 40).map((d) => aFecha(d.fecha));
  const conVentas = dias.filter((d) => d.vendidos > 0 && d.vendidos < 30).map((d) => aFecha(d.fecha));
  const hoy = aFecha(hoyEnLima());

  return (
    <div className="calendario">
      <DayPicker mode="single" locale={es} required
        selected={valor ? aFecha(valor) : undefined}
        onSelect={(f) => f && onCambiar(aTexto(f))}
        disabled={[{ before: hoy }, ...lleno]}
        startMonth={hoy} endMonth={new Date(hoy.getFullYear(), hoy.getMonth() + 3, 1)}
        modifiers={{ lleno, pocos, conVentas }}
        modifiersClassNames={{ lleno: 'dia-lleno', pocos: 'dia-pocos', conVentas: 'dia-ventas' }}
        footer={<p className="nota">{valor ? `Viaje el ${valor.split('-').reverse().join('/')}` : 'Elige el día de tu viaje.'} · <span className="punto-pocos" /> pocos asientos · <span className="punto-ventas" /> con ventas</p>} />
    </div>
  );
}
