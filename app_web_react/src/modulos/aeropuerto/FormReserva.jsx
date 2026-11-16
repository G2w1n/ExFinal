// src/modulos/aeropuerto/FormReserva.jsx
// Campos de la reserva con la tarifa calculada por el servidor en vivo
import { useEffect, useState } from 'react';
import { reservasApi } from '../../api/servicios.api.js';
import { Desglose } from '../../components/Desglose.jsx';

export function FormReserva({ reserva, setReserva, precargados = [], tipo = 'auto', sinNombre = false }) {
  const [cotizacion, setCotizacion] = useState(null);
  const cambiar = (campo) => (e) => setReserva({ ...reserva, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const etiqueta = (campo) => precargados.includes(campo) && <span className="precargado">precargado</span>;

  useEffect(() => {
    const t = setTimeout(() => {
      reservasApi.cotizar({ horas: reserva.horas, fecha_hora_entrada: reserva.fecha_hora_entrada, zona_vip: reserva.zona_vip, tipo })
        .then(setCotizacion).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [reserva.horas, reserva.fecha_hora_entrada, reserva.zona_vip, tipo]);

  const clase = (campo) => (precargados.includes(campo) ? 'campo-precargado' : undefined);
  return (
    <div className="form-reserva">
      <div className="fila-2">
        <label>Placa {etiqueta('placa')}
          <input className={clase('placa')} value={reserva.placa} onChange={cambiar('placa')} placeholder="ABC-123" required pattern="[A-Za-z0-9]{3}-[A-Za-z0-9]{3}" maxLength={7} autoCapitalize="characters" />
        </label>
        {!sinNombre && (
          <label>Nombre del pasajero {etiqueta('nombre_pasajero')}
            <input className={clase('nombre_pasajero')} value={reserva.nombre_pasajero} onChange={cambiar('nombre_pasajero')} required minLength={2} maxLength={80} />
          </label>
        )}
        <label>Ingreso {etiqueta('fecha_hora_entrada')}
          <input className={clase('fecha_hora_entrada')} type="datetime-local" value={reserva.fecha_hora_entrada} onChange={cambiar('fecha_hora_entrada')} required />
        </label>
        <label>Horas {etiqueta('horas')}
          <input className={clase('horas')} type="number" min="1" max="240" step="1" value={reserva.horas} onChange={cambiar('horas')} required />
          <small>Hora o fracción · tope S/ 60 por día · nocturna S/ 20</small>
        </label>
      </div>
      {tipo === 'auto' && (
        <label className="check"><input type="checkbox" checked={reserva.zona_vip} onChange={cambiar('zona_vip')} /> Zona techada VIP (+ S/ 15)</label>
      )}
      <Desglose cotizacion={cotizacion} />
    </div>
  );
}
