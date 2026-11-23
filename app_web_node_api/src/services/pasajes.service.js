// src/services/pasajes.service.js
// Reglas de TransAndino: precio en el servidor, asiento libre, estados en orden y transacciones
import { enTransaccion, pool } from '../config/db.js';
import * as repo from '../repositories/pasajes.repository.js';
import * as historial from '../repositories/historial.repository.js';
import * as pagos from '../repositories/pagos.repository.js';
import { tieneRol } from '../middlewares/requireRol.js';
import { AppError } from '../utils/AppError.js';
import { cotizarPasaje, sumarHoras, tipoDeAsiento } from '../utils/tarifas.js';
import { FECHA, numero } from '../utils/validaciones.js';
import { buscarPorCorreo } from '../repositories/usuarios.repository.js';
import { avisarPasaje } from '../config/tiempoReal.js';

const METODOS = ['tarjeta', 'billetera', 'efectivo'];
// Estados en orden: de cada estado, a cuáles se puede pasar
const SIGUIENTES = { registrado: ['pagado', 'cancelado'], pagado: ['abordado', 'cancelado'], abordado: [], cancelado: [] };

const esPersonalTA = (u) => tieneRol(u, 'transandino', 'administrador', 'empleado');
const hoyEnLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

export const rutas = () => repo.rutas();
export const cotizar = (datos) => cotizarPasaje(datos);

// Valida y arma los datos del viaje: ruta, fecha, asiento libre y precio calculado aquí
async function armarViaje(body, excepto = 0) {
  const ruta = await repo.ruta(numero(body.id_ruta, 'La ruta', { min: 1, entero: true }));
  if (!ruta) throw new AppError(400, 'Esa ruta no existe.');
  const fecha = String(body.fecha ?? '');
  if (!FECHA.test(fecha)) throw new AppError(400, 'Elige la fecha del viaje.');
  if (fecha < hoyEnLima()) throw new AppError(400, 'La fecha del viaje ya pasó.');
  const asiento = numero(body.asiento, 'El asiento', { min: 1, max: 40, entero: true });
  const tipoAsiento = tipoDeAsiento(asiento); // 1–12 cama (1.er piso), 13–40 semicama (2.º piso)
  const equipajeKg = numero(body.equipaje_kg ?? 0, 'El equipaje', { min: 0, max: 100 });

  const fechaSalida = `${fecha} ${ruta.hora_salida}:00`;
  if ((await repo.asientosOcupados(ruta.id, fechaSalida, excepto)).includes(asiento)) {
    throw new AppError(409, `El asiento ${asiento} ya está vendido para ese viaje. Elige otro.`);
  }
  return {
    idRuta: ruta.id, fechaSalida, horaLlegada: sumarHoras(fechaSalida, ruta.duracion_horas),
    asiento, tipoAsiento, equipajeKg, precio: cotizarPasaje({ tipo_asiento: tipoAsiento, equipaje_kg: equipajeKg }).total,
  };
}

export async function disponibilidad({ id_ruta, desde, dias = 90 }) {
  const ruta = await repo.ruta(numero(id_ruta, 'La ruta', { min: 1, entero: true }));
  if (!ruta) throw new AppError(400, 'Esa ruta no existe.');
  const inicio = FECHA.test(String(desde ?? '')) ? desde : hoyEnLima();
  return { total: 40, dias: await repo.vendidosPorDia(ruta.id, inicio, numero(dias, 'Los días', { min: 1, max: 180, entero: true })) };
}

export async function asientos({ id_ruta, fecha }) {
  const ruta = await repo.ruta(numero(id_ruta, 'La ruta', { min: 1, entero: true }));
  if (!ruta || !FECHA.test(String(fecha ?? ''))) throw new AppError(400, 'Elige la ruta y la fecha.');
  return { ocupados: await repo.asientosOcupados(ruta.id, `${fecha} ${ruta.hora_salida}:00`), total: 40 };
}

// El cliente compra para sí; el personal de TransAndino puede vender a un cliente (venta presencial)
export async function comprar(usuario, body) {
  let idUsuario = usuario.id;
  if (body.correo_cliente) {
    if (!esPersonalTA(usuario)) throw new AppError(403, 'Solo el personal de TransAndino vende a otros clientes.');
    const cliente = await buscarPorCorreo(String(body.correo_cliente).trim().toLowerCase());
    if (!cliente) throw new AppError(404, 'No hay un cliente con ese correo.');
    idUsuario = cliente.id;
  } else if (!tieneRol(usuario, 'transandino', 'cliente', 'administrador', 'empleado')) {
    throw new AppError(403, 'Tu cuenta no tiene acceso a TransAndino.');
  }
  const viaje = await armarViaje(body);
  const id = await enTransaccion(async (db) => {
    const nuevo = await repo.crear(db, { ...viaje, idUsuario });
    await historial.registrar(db, { entidad: 'pasaje', id: nuevo, estado: 'registrado', usuarioId: usuario.id,
      nota: body.correo_cliente ? 'Venta presencial' : 'Compra en línea' });
    return nuevo;
  });
  const p = await repo.porId(id);
  avisarPasaje(p, 'comprado');
  return p;
}

// El dueño o el personal de TransAndino
async function obtenerPermitido(usuario, id) {
  const p = await repo.porId(id);
  if (!p) throw new AppError(404, 'Ese pasaje no existe.');
  if (p.id_usuario !== usuario.id && !esPersonalTA(usuario)) throw new AppError(403, 'Ese pasaje no es tuyo.');
  return p;
}

export const detalle = (usuario, id) => obtenerPermitido(usuario, id);

// Comprobante: solo de un pasaje pagado
export async function comprobante(usuario, id) {
  const pasaje = await obtenerPermitido(usuario, id);
  const pago = await pagos.deEntidad('pasaje', id);
  if (!pago) throw new AppError(409, 'Este pasaje todavía no está pagado.');
  return { pasaje, pago };
}
export const misPasajes = (usuario) => repo.deUsuario(usuario.id);
export const listar = (filtros) => repo.listar({ buscar: String(filtros.buscar ?? ''), estado: String(filtros.estado ?? ''), fecha: String(filtros.fecha ?? '') });

export async function historialDe(usuario, id) {
  await obtenerPermitido(usuario, id);
  return historial.deEntidad('pasaje', id);
}

// Solo se edita antes de pagar: cambian ruta, fecha, asiento y equipaje, y el precio se recalcula
export async function editar(usuario, id, body) {
  const p = await obtenerPermitido(usuario, id);
  if (p.estado !== 'registrado') throw new AppError(409, 'Solo se puede editar un pasaje que aún no se pagó.');
  const viaje = await armarViaje({
    id_ruta: body.id_ruta ?? p.id_ruta, fecha: body.fecha ?? p.fecha_salida.slice(0, 10),
    asiento: body.asiento ?? p.asiento, equipaje_kg: body.equipaje_kg ?? p.equipaje_kg,
  }, p.id);
  await enTransaccion(async (db) => {
    await repo.actualizar(db, id, viaje);
    await historial.registrar(db, { entidad: 'pasaje', id, estado: 'registrado', usuarioId: usuario.id, nota: 'Pasaje editado' });
  });
  const actualizado = await repo.porId(id);
  avisarPasaje(actualizado);
  return actualizado;
}

async function pasarA(usuario, id, nuevo, nota, alPasar) {
  const extra = await enTransaccion(async (db) => {
    const p = await repo.porId(id, db, true); // FOR UPDATE: nadie más lo cambia mientras tanto
    if (!p) throw new AppError(404, 'Ese pasaje no existe.');
    if (!SIGUIENTES[p.estado].includes(nuevo)) throw new AppError(409, `Un pasaje ${p.estado} no puede pasar a ${nuevo}.`);
    const extra = alPasar ? await alPasar(db, p) : null;
    await repo.cambiarEstado(db, id, nuevo);
    await historial.registrar(db, { entidad: 'pasaje', id, estado: nuevo, usuarioId: usuario.id, nota });
    return extra;
  });
  avisarPasaje(await repo.porId(id));
  return extra;
}

export async function pagar(usuario, id, { metodo }) {
  const p = await obtenerPermitido(usuario, id);
  if (!METODOS.includes(metodo)) throw new AppError(400, 'Elige el medio de pago.');
  const pago = await pasarA(usuario, id, 'pagado', `Pago con ${metodo}`, (db, fila) =>
    pagos.registrar(db, { entidad: 'pasaje', idEntidad: id, idUsuario: p.id_usuario, metodo, monto: fila.precio }));
  return { pasaje: await repo.porId(id), pago };
}

export async function cancelar(usuario, id) {
  const p = await obtenerPermitido(usuario, id);
  if (p.estado === 'pagado' && !esPersonalTA(usuario)) throw new AppError(409, 'Un pasaje pagado solo lo cancela el personal de TransAndino.');
  await pasarA(usuario, id, 'cancelado', 'Pasaje cancelado');
  return repo.porId(id);
}

// Personal: marcar abordado o cancelar
export async function cambiarEstado(usuario, id, { estado }) {
  if (!['abordado', 'cancelado'].includes(estado)) throw new AppError(400, 'Estado no válido.');
  await pasarA(usuario, id, estado, estado === 'abordado' ? 'Pasajero abordó el bus' : 'Cancelado por el personal');
  return repo.porId(id);
}

export async function eliminar(usuario, id) {
  const p = await repo.porId(id);
  if (!p) throw new AppError(404, 'Ese pasaje no existe.');
  if (p.reserva_codigo) throw new AppError(409, `Tiene la reserva ${p.reserva_codigo} enlazada: cancélala primero.`);
  if (!['registrado', 'cancelado'].includes(p.estado)) throw new AppError(409, 'Solo se eliminan pasajes sin pagar o cancelados.');
  const { rows } = await pool.query(`SELECT 1 FROM reservas_estacionamiento WHERE id_pasaje = $1`, [id]);
  if (rows.length) throw new AppError(409, 'El pasaje tiene una reserva de estacionamiento enlazada.');
  await enTransaccion((db) => repo.eliminar(db, id));
  avisarPasaje(p, 'eliminado');
}
