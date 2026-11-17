// src/utils/fechas.js
// Suma horas a "AAAA-MM-DD HH:MM:SS" (hora de Perú) y devuelve "AAAA-MM-DDTHH:MM", sin zonas horarias
export function sumarHorasTexto(fecha, horas) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(fecha ?? ''));
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + horas * 3600000);
  return d.toISOString().slice(0, 16);
}
