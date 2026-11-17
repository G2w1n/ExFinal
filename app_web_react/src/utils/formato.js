// src/utils/formato.js
export const soles = (n) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(n) || 0);

// "2026-11-08 15:30:00" (hora de Perú, sin zona) -> "08/11/2026 15:30"
export function fechaHora(texto) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(texto ?? ''));
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : '—';
}
export const hora = (texto) => String(texto ?? '').slice(11, 16);
export const fecha = (texto) => fechaHora(texto).slice(0, 10);

// Fechas con zona (creado, pagos, historial) -> hora de Lima
export const momento = (valor) => (valor
  ? new Date(valor).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })
  : '—');

// Fecha con zona -> solo la hora de Lima, "14:05"
export const horaDe = (valor) => (valor ? new Date(valor).toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

export const hoyEnLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
// Valor para <input type="datetime-local"> dentro de N horas
export function dentroDe(horas) {
  const d = new Date(Date.now() + horas * 3600000);
  return d.toLocaleString('sv-SE', { timeZone: 'America/Lima' }).slice(0, 16).replace(' ', 'T');
}
// ¿El pasaje permite reservar estacionamiento? Llega a Cusco (donde está el aeropuerto) y todavía no llegó
export const puedeReservarEstacionamiento = (p) => p.estado !== 'cancelado' && p.destino === 'Cusco'
  && String(p.hora_llegada).replace(' ', 'T') > dentroDe(0);

export const aInputFecha = (texto) => String(texto ?? '').slice(0, 16).replace(' ', 'T');
