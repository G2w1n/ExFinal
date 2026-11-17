// src/services/caja.service.js
// Ventanilla única: cobra pasajes (personal de TransAndino) y estacionamiento (personal del Aeropuerto).
// Solo con la caja abierta; en efectivo calcula el vuelto; al cerrar compara el efectivo esperado con el contado.
import { enTransaccion } from '../config/db.js';
import * as repo from '../repositories/caja.repository.js';
import * as historial from '../repositories/historial.repository.js';
import * as pagos from '../repositories/pagos.repository.js';
import { tieneRol } from '../middlewares/requireRol.js';
import { AppError } from '../utils/AppError.js';
import { redondear } from '../utils/tarifas.js';
import { numero } from '../utils/validaciones.js';

const PERSONAL = ['administrador', 'empleado'];
const atiende = (u) => ({ pasajes: tieneRol(u, 'transandino', ...PERSONAL), reservas: tieneRol(u, 'aeropuerto', ...PERSONAL) });
const TABLA = { pasaje: { tabla: 'compras_pasajes', monto: 'precio' }, reserva: { tabla: 'reservas_estacionamiento', monto: 'monto' } };
const NOMBRE_METODO = { efectivo: 'efectivo', pos: 'tarjeta en POS', billetera: 'billetera' };

async function resumenDe(caja) {
  const totales = await repo.totales(caja);
  const efectivo = totales.find((t) => t.metodo === 'efectivo')?.total ?? 0;
  return { caja, totales, esperado: redondear(Number(caja.monto_inicial) + Number(efectivo)), cobros: await repo.cobros(caja) };
}

export async function estado(usuario) {
  const caja = await repo.abierta(usuario.id);
  return { atiende: atiende(usuario), ...(caja ? await resumenDe(caja) : { caja: null }) };
}

export async function abrir(usuario, { monto_inicial }) {
  const monto = numero(monto_inicial, 'El fondo inicial', { min: 0, max: 5000 });
  if (await repo.abierta(usuario.id)) throw new AppError(409, 'Ya tienes una caja abierta.');
  await repo.abrir(usuario.id, redondear(monto));
  return estado(usuario);
}

export function pendientes(usuario, { buscar }) {
  const a = atiende(usuario);
  return repo.pendientes({ buscar: String(buscar ?? '').trim(), ...a });
}

export async function cobrar(usuario, { entidad, id, metodo, monto_recibido }) {
  const datos = TABLA[entidad];
  if (!datos) throw new AppError(400, 'Elige qué se cobra.');
  const a = atiende(usuario);
  if ((entidad === 'pasaje' && !a.pasajes) || (entidad === 'reserva' && !a.reservas)) {
    throw new AppError(403, entidad === 'pasaje' ? 'Solo el personal de TransAndino cobra pasajes.' : 'Solo el personal del Aeropuerto cobra el estacionamiento.');
  }
  if (!NOMBRE_METODO[metodo]) throw new AppError(400, 'Elige el medio de pago.');
  const caja = await repo.abierta(usuario.id);
  if (!caja) throw new AppError(409, 'Primero abre tu caja con el fondo inicial.');
  const idRegistro = numero(id, 'El registro', { min: 1, entero: true });

  return enTransaccion(async (db) => {
    const { rows } = await db.query(`SELECT * FROM ${datos.tabla} WHERE id = $1 FOR UPDATE`, [idRegistro]);
    const fila = rows[0];
    if (!fila) throw new AppError(404, 'Ese registro no existe.');
    if (fila.estado !== 'registrado') throw new AppError(409, `Ese registro ya está ${fila.estado}.`);
    const monto = Number(fila[datos.monto]);
    let recibido = null;
    let vuelto = null;
    if (metodo === 'efectivo') {
      recibido = redondear(numero(monto_recibido, 'El monto recibido', { min: 0, max: 99999 }));
      if (recibido < monto) throw new AppError(400, 'El monto recibido es menor que el total.');
      vuelto = redondear(recibido - monto);
    }
    const pago = await pagos.registrar(db, { entidad, idEntidad: idRegistro, idUsuario: fila.id_usuario, metodo, monto, idCajero: usuario.id, recibido, vuelto });
    await db.query(`UPDATE ${datos.tabla} SET estado = 'pagado' WHERE id = $1`, [idRegistro]);
    await historial.registrar(db, { entidad, id: idRegistro, estado: 'pagado', usuarioId: usuario.id, nota: `Cobro en ventanilla (${NOMBRE_METODO[metodo]})` });
    return { ...pago, codigo: fila.codigo, entidad, id: idRegistro, vuelto, monto_recibido: recibido };
  });
}

export async function cerrar(usuario, { contado, nota }) {
  const caja = await repo.abierta(usuario.id);
  if (!caja) throw new AppError(409, 'No tienes una caja abierta.');
  const { esperado } = await resumenDe(caja);
  const total = redondear(numero(contado, 'El efectivo contado', { min: 0, max: 99999 }));
  const texto = String(nota ?? '').trim().slice(0, 200);
  if (Math.abs(total - esperado) >= 0.01 && texto.length < 3) throw new AppError(400, 'Hay diferencia: escribe una nota que la explique.');
  const cerrada = await repo.cerrar(caja.id, { esperado, contado: total, nota: texto || null });
  if (!cerrada) throw new AppError(409, 'La caja ya estaba cerrada.');
  return cerrada;
}
