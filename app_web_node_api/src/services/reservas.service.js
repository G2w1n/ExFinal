// src/services/reservas.service.js
// Reglas del Aeropuerto: tarifa calculada en el servidor, estados en orden y enlace con el pasaje
import { enTransaccion } from '../config/db.js';
import * as repo from '../repositories/reservas.repository.js';
import * as pasajes from '../repositories/pasajes.repository.js';
import * as historial from '../repositories/historial.repository.js';
import * as pagos from '../repositories/pagos.repository.js';
import { tieneRol } from '../middlewares/requireRol.js';
import { AppError } from '../utils/AppError.js';
import { cotizarEstacionamiento } from '../utils/tarifas.js';
import { fechaHora, numero, placa, texto } from '../utils/validaciones.js';
import { avisarReserva } from '../config/tiempoReal.js';

const METODOS = ['tarjeta', 'billetera', 'efectivo'];
const SIGUIENTES = {
  registrado: ['pagado', 'cancelado'], pagado: ['preparado', 'finalizado', 'cancelado'],
  preparado: ['finalizado', 'cancelado'], finalizado: [], cancelado: [],
};
const esPersonalAero = (u) => tieneRol(u, 'aeropuerto', 'administrador', 'empleado');
const ahoraEnLima = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Lima' }).slice(0, 16);
const vip = (v) => v === true || v === 'true' || v === 'on';

// Capacidad del estacionamiento (la misma del Parcial)
export const CAPACIDAD = { normal: 60, vip: 20, bus: 8 };
export const ocupacion = async () => ({ capacidad: CAPACIDAD, reservas: await repo.ocupacion() });

export const cotizar = (body) => cotizarEstacionamiento({ ...body, zona_vip: vip(body.zona_vip) });

function armarDatos(body, tipo) {
  const entrada = fechaHora(body.fecha_hora_entrada, 'La fecha de ingreso');
  if (entrada.slice(0, 16) < ahoraEnLima().replace('T', ' ')) throw new AppError(400, 'La fecha de ingreso ya pasó.');
  const horas = numero(body.horas, 'Las horas', { min: 1, max: 240 });
  const zonaVip = tipo === 'bus' ? false : vip(body.zona_vip);
  return {
    placa: placa(body.placa), nombrePasajero: texto(body.nombre_pasajero, 'Nombre del pasajero', { min: 2, max: 80 }),
    entrada, horas, zonaVip, tipo,
    monto: cotizarEstacionamiento({ horas, fecha_hora_entrada: entrada, tipo, zona_vip: zonaVip }).total,
  };
}

async function guardarNueva(usuario, datos, nota) {
  const id = await enTransaccion(async (db) => {
    const nuevo = await repo.crear(db, datos);
    await historial.registrar(db, { entidad: 'reserva', id: nuevo, estado: 'registrado', usuarioId: usuario.id, nota });
    return nuevo;
  });
  const r = await repo.porId(id);
  avisarReserva(r, 'creada');
  return r;
}

// Reserva de auto del cliente; si viene id_pasaje, se enlaza con su pasaje de TransAndino
export async function crear(usuario, body) {
  if (!tieneRol(usuario, 'aeropuerto', 'cliente', 'administrador', 'empleado')) throw new AppError(403, 'Tu cuenta no tiene acceso al Aeropuerto.');
  let idPasaje = null;
  if (body.id_pasaje) {
    const p = await pasajes.porId(numero(body.id_pasaje, 'El pasaje', { min: 1, entero: true }));
    if (!p || p.id_usuario !== usuario.id) throw new AppError(403, 'Ese pasaje no es tuyo.');
    if (p.estado === 'cancelado') throw new AppError(409, 'Ese pasaje está cancelado.');
    if (p.destino !== 'Cusco') throw new AppError(409, 'Ese viaje no llega a Cusco.');
    if (p.reserva_codigo) throw new AppError(409, `Ese pasaje ya tiene la reserva ${p.reserva_codigo}.`);
    idPasaje = p.id;
  }
  const datos = armarDatos({ ...body, nombre_pasajero: body.nombre_pasajero || usuario.nombre }, 'auto');
  return guardarNueva(usuario, { ...datos, idUsuario: usuario.id, idPasaje }, idPasaje ? 'Reserva enlazada a un pasaje' : 'Reserva en línea');
}

// Integración 2: el administrador de TransAndino reserva espacio para sus buses (tipo = 'bus')
export async function crearEspacioBus(usuario, body) {
  if (!tieneRol(usuario, 'transandino', 'administrador')) throw new AppError(403, 'Solo el administrador de TransAndino reserva espacio para buses.');
  const datos = armarDatos({ ...body, nombre_pasajero: 'TransAndino Perú' }, 'bus');
  return guardarNueva(usuario, { ...datos, idUsuario: usuario.id }, 'Espacio para bus de traslado');
}

async function obtenerPermitido(usuario, id) {
  const e = await repo.porId(id);
  if (!e) throw new AppError(404, 'Esa reserva no existe.');
  if (e.id_usuario !== usuario.id && !esPersonalAero(usuario)) throw new AppError(403, 'Esa reserva no es tuya.');
  return e;
}

export const detalle = (usuario, id) => obtenerPermitido(usuario, id);

// Comprobante: solo de una reserva pagada; su QR es el pase de salida de la garita
export async function comprobante(usuario, id) {
  const reserva = await obtenerPermitido(usuario, id);
  const pago = await pagos.deEntidad('reserva', id);
  if (!pago) throw new AppError(409, 'Esta reserva todavía no está pagada.');
  return { reserva, pago };
}
export const mias = (usuario) => repo.deUsuario(usuario.id);
export const listar = (q) => repo.listar({ buscar: String(q.buscar ?? ''), estado: String(q.estado ?? ''), tipo: String(q.tipo ?? ''), fecha: String(q.fecha ?? '') });

export async function historialDe(usuario, id) {
  await obtenerPermitido(usuario, id);
  return historial.deEntidad('reserva', id);
}

export async function editar(usuario, id, body) {
  const e = await obtenerPermitido(usuario, id);
  if (e.estado !== 'registrado') throw new AppError(409, 'Solo se puede editar una reserva que aún no se pagó.');
  const datos = armarDatos({
    placa: body.placa ?? e.placa, nombre_pasajero: body.nombre_pasajero ?? e.nombre_pasajero,
    fecha_hora_entrada: body.fecha_hora_entrada ?? e.fecha_hora_entrada, horas: body.horas ?? e.horas, zona_vip: body.zona_vip ?? e.zona_vip,
  }, e.tipo);
  await enTransaccion(async (db) => {
    await repo.actualizar(db, id, datos);
    await historial.registrar(db, { entidad: 'reserva', id, estado: 'registrado', usuarioId: usuario.id, nota: 'Reserva editada' });
  });
  const r = await repo.porId(id);
  avisarReserva(r);
  return r;
}

async function pasarA(usuario, id, nuevo, nota, alPasar) {
  const extra = await enTransaccion(async (db) => {
    const e = await repo.porId(id, db, true);
    if (!e) throw new AppError(404, 'Esa reserva no existe.');
    if (!SIGUIENTES[e.estado].includes(nuevo)) throw new AppError(409, `Una reserva ${e.estado} no puede pasar a ${nuevo}.`);
    const extra = alPasar ? await alPasar(db, e) : null;
    await repo.cambiarEstado(db, id, nuevo);
    await historial.registrar(db, { entidad: 'reserva', id, estado: nuevo, usuarioId: usuario.id, nota });
    return extra;
  });
  avisarReserva(await repo.porId(id));
  return extra;
}

export async function pagar(usuario, id, { metodo }) {
  const e = await obtenerPermitido(usuario, id);
  if (!METODOS.includes(metodo)) throw new AppError(400, 'Elige el medio de pago.');
  const pago = await pasarA(usuario, id, 'pagado', `Pago con ${metodo}`, (db, fila) =>
    pagos.registrar(db, { entidad: 'reserva', idEntidad: id, idUsuario: e.id_usuario, metodo, monto: fila.monto }));
  return { reserva: await repo.porId(id), pago };
}

export async function cancelar(usuario, id) {
  const e = await obtenerPermitido(usuario, id);
  if (e.estado !== 'registrado' && !esPersonalAero(usuario)) throw new AppError(409, 'Una reserva pagada solo la cancela el personal del aeropuerto.');
  await pasarA(usuario, id, 'cancelado', 'Reserva cancelada');
  return repo.porId(id);
}

// Personal del aeropuerto: preparar el espacio, finalizar (el vehículo salió) o cancelar
export async function cambiarEstado(usuario, id, { estado }) {
  const notas = { preparado: 'Espacio preparado', finalizado: 'El vehículo salió', cancelado: 'Cancelada por el personal' };
  if (!notas[estado]) throw new AppError(400, 'Estado no válido.');
  await pasarA(usuario, id, estado, notas[estado]);
  return repo.porId(id);
}

export async function asignarZona(usuario, id, { zona }) {
  const z = texto(zona, 'La zona', { min: 1, max: 20 }).toUpperCase();
  const e = await repo.porId(id);
  if (!e) throw new AppError(404, 'Esa reserva no existe.');
  if (['finalizado', 'cancelado'].includes(e.estado)) throw new AppError(409, 'Esa reserva ya terminó.');
  await enTransaccion(async (db) => {
    await repo.asignarZona(db, id, z);
    await historial.registrar(db, { entidad: 'reserva', id, estado: e.estado, usuarioId: usuario.id, nota: `Zona ${z} asignada` });
  });
  const r = await repo.porId(id);
  avisarReserva(r, `zona ${z}`);
  return r;
}

export async function eliminar(_usuario, id) {
  const e = await repo.porId(id);
  if (!e) throw new AppError(404, 'Esa reserva no existe.');
  if (!['registrado', 'cancelado'].includes(e.estado)) throw new AppError(409, 'Solo se eliminan reservas sin pagar o canceladas.');
  await enTransaccion((db) => repo.eliminar(db, id));
  avisarReserva(e, 'eliminada');
}
