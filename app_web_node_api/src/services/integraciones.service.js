// src/services/integraciones.service.js
import * as repo from '../repositories/integraciones.repository.js';
import * as pasajes from '../repositories/pasajes.repository.js';
import { AppError } from '../utils/AppError.js';
import { FECHA, idParam } from '../utils/validaciones.js';
import { sumarHoras } from '../utils/tarifas.js';

export const misViajes = (usuario) => repo.misViajes(usuario.id);
export const misBuses = (usuario) => repo.busesDe(usuario.id);

// Datos precargados para «Reservar estacionamiento» desde un pasaje: ingreso 30 min después de la llegada
export async function prellenado(usuario, idPasaje) {
  const p = await pasajes.porId(idParam(idPasaje));
  if (!p || p.id_usuario !== usuario.id) throw new AppError(404, 'Ese pasaje no es tuyo.');
  if (p.estado === 'cancelado') throw new AppError(409, 'Ese pasaje está cancelado.');
  if (p.destino !== 'Cusco') throw new AppError(409, 'Ese viaje no llega a Cusco: el estacionamiento es del aeropuerto del Cusco.');
  if (p.reserva_codigo) throw new AppError(409, `Ese pasaje ya tiene la reserva ${p.reserva_codigo}.`);
  return {
    id_pasaje: p.id, pasaje_codigo: p.codigo, ruta: `${p.origen} → ${p.destino}`, hora_llegada: p.hora_llegada,
    fecha_hora_entrada: sumarHoras(p.hora_llegada, 0.5).slice(0, 16).replace(' ', 'T'),
    nombre_pasajero: p.cliente, horas: 8,
  };
}

export function llegadas(fecha) {
  const f = fecha ? String(fecha) : new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  if (!FECHA.test(f)) throw new AppError(400, 'La fecha no es válida.');
  return repo.llegadas(f);
}
