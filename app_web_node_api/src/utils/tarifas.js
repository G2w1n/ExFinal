// src/utils/tarifas.js
// Reglas de precio de los dos módulos. Funciones PURAS: el precio SIEMPRE se calcula
// aquí, en el servidor; el total que envía el navegador se ignora.

export const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100;
const soles = (n) => `S/ ${n.toFixed(2)}`;

/* ============================== TransAndino: pasajes ============================== */
// Semicama (2.º piso) S/ 60 · Cama (1.er piso) S/ 85 · 20 kg de equipaje libres y S/ 4 por kg extra
export const PASAJE = { semicama: 60, cama: 85, kgLibres: 20, porKgExtra: 4, asientosCama: 12 };

// El bus tiene 40 asientos: del 1 al 12 son cama (1.er piso) y del 13 al 40 semicama (2.º piso)
export const tipoDeAsiento = (asiento) => (Number(asiento) <= PASAJE.asientosCama ? 'cama' : 'semicama');

export function cotizarPasaje({ asiento, tipo_asiento = asiento ? tipoDeAsiento(asiento) : 'semicama', equipaje_kg = 0 }) {
  const base = tipo_asiento === 'cama' ? PASAJE.cama : PASAJE.semicama;
  const kgExtra = Math.max(0, Math.ceil(Number(equipaje_kg) || 0) - PASAJE.kgLibres);
  const lineas = [{ etiqueta: `Asiento ${tipo_asiento === 'cama' ? 'cama (1.er piso)' : 'semicama (2.º piso)'}`, valor: base }];
  if (kgExtra > 0) lineas.push({ etiqueta: `Exceso de equipaje (${kgExtra} kg × ${soles(PASAJE.porKgExtra)})`, valor: kgExtra * PASAJE.porKgExtra });
  return { lineas, total: redondear(lineas.reduce((s, l) => s + l.valor, 0)) };
}

/* ============================== Aeropuerto: estacionamiento ============================== */
export const ESTACIONAMIENTO = {
  porHora: 7, diaCompleto: 60, nocturna: 20, horasNocturna: 8,
  descuentoFinDeSemana: 0.1, recargoBus: 0.5, adicionalVip: 15,
};

// "2026-11-08 15:30:00" -> hora y día de la semana (la fecha ya está en hora de Perú)
function datosEntrada(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(fecha ?? ''));
  if (!m) return null;
  return { hora: Number(m[4]), diaSemana: new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay() };
}

// Hora o fracción, con la tarifa que más le conviene al cliente (por hora, nocturna, tope o por día)
export function cotizarEstacionamiento({ horas, fecha_hora_entrada, tipo = 'auto', zona_vip = false }) {
  const T = ESTACIONAMIENTO;
  const h = Math.ceil(Number(horas) || 0);
  const lineas = [];
  if (h <= 0) return { lineas, total: 0, nota: '' };
  const entrada = datosEntrada(fecha_hora_entrada);

  let base;
  const dias = Math.floor(h / 24);
  const resto = h % 24;
  if (dias >= 1) {
    const adicional = Math.min(resto * T.porHora, T.diaCompleto);
    base = dias * T.diaCompleto + adicional;
    lineas.push({ etiqueta: `Tarifa por día (${dias} × ${soles(T.diaCompleto)})`, valor: dias * T.diaCompleto });
    if (resto > 0) lineas.push({ etiqueta: `Horas adicionales (${resto} h)`, valor: adicional });
  } else if (entrada && (entrada.hora >= 22 || entrada.hora < 6) && h <= T.horasNocturna && T.nocturna < h * T.porHora) {
    base = T.nocturna;
    lineas.push({ etiqueta: `Tarifa nocturna (22:00 a 06:00, hasta ${T.horasNocturna} h)`, valor: base });
  } else if (h * T.porHora > T.diaCompleto) {
    base = T.diaCompleto;
    lineas.push({ etiqueta: `Estacionamiento (${h} h, tope diario)`, valor: base });
  } else {
    base = h * T.porHora;
    lineas.push({ etiqueta: `Estacionamiento (${h} h × ${soles(T.porHora)})`, valor: base });
  }

  if (entrada && (entrada.diaSemana === 0 || entrada.diaSemana === 6)) {
    const descuento = redondear(base * T.descuentoFinDeSemana);
    lineas.push({ etiqueta: 'Descuento fin de semana (-10 %)', valor: -descuento });
    base -= descuento;
  }
  if (tipo === 'bus') lineas.push({ etiqueta: 'Recargo bus (+50 %)', valor: redondear(base * T.recargoBus) });
  if (zona_vip === true || zona_vip === 'true' || zona_vip === 'on') lineas.push({ etiqueta: 'Zona techada VIP', valor: T.adicionalVip });

  const nota = Number(horas) !== h ? `${Number(horas)} h se cobra como ${h} h (hora o fracción).` : '';
  return { lineas, total: redondear(lineas.reduce((s, l) => s + l.valor, 0)), nota };
}

// Suma horas a "AAAA-MM-DD HH:MM:SS" sin pasar por zonas horarias
export function sumarHoras(fecha, horas) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(fecha);
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + Number(horas) * 3600000);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
