// src/services/crm.service.js
import * as repo from '../repositories/crm.repository.js';
import { AppError } from '../utils/AppError.js';
import { texto } from '../utils/validaciones.js';

export const clientes = (q) => repo.clientes({ buscar: String(q.buscar ?? ''), segmento: String(q.segmento ?? '') });
export const indicadores = async () => ({ ...(await repo.indicadores()), serie: await repo.ingresosPorDia(14), por_metodo: await repo.porMetodo() });

// Campanita: el personal ve lo de sus apps; el cliente, lo de sus viajes
export function notificaciones(usuario) {
  const r = usuario.roles ?? {};
  const personal = (m) => ['administrador', 'empleado'].includes(r[m]);
  if (personal('transandino') || personal('aeropuerto')) {
    return repo.notificacionesPersonal({ pasajes: personal('transandino'), reservas: personal('aeropuerto') });
  }
  return repo.notificacionesCliente(usuario.id);
}

export async function ficha(id) {
  const cliente = await repo.cliente(id);
  if (!cliente) throw new AppError(404, 'Ese cliente no existe.');
  const [pasajes, reservas, lineaDeTiempo, notas] = await Promise.all([
    repo.pasajesDe(id), repo.reservasDe(id), repo.lineaDeTiempo(id), repo.notas(id),
  ]);
  return { cliente, pasajes, reservas, lineaDeTiempo, notas };
}

export async function agregarNota(usuario, id, body) {
  if (!(await repo.cliente(id))) throw new AppError(404, 'Ese cliente no existe.');
  return repo.agregarNota(id, usuario.id, texto(body.texto, 'La nota', { min: 2, max: 500 }));
}
