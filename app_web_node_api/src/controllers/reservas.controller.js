// src/controllers/reservas.controller.js
import * as s from '../services/reservas.service.js';
import { idParam } from '../utils/validaciones.js';

export const cotizar = async (req, res) => res.json(s.cotizar(req.body ?? {}));
export const crear = async (req, res) => res.status(201).json(await s.crear(req.usuario, req.body ?? {}));
export const mias = async (req, res) => res.json(await s.mias(req.usuario));
export const listar = async (req, res) => res.json(await s.listar(req.query));
export const detalle = async (req, res) => res.json(await s.detalle(req.usuario, idParam(req.params.id)));
export const historial = async (req, res) => res.json(await s.historialDe(req.usuario, idParam(req.params.id)));
export const editar = async (req, res) => res.json(await s.editar(req.usuario, idParam(req.params.id), req.body ?? {}));
export const pagar = async (req, res) => res.json(await s.pagar(req.usuario, idParam(req.params.id), req.body ?? {}));
export const cancelar = async (req, res) => res.json(await s.cancelar(req.usuario, idParam(req.params.id)));
export const estado = async (req, res) => res.json(await s.cambiarEstado(req.usuario, idParam(req.params.id), req.body ?? {}));
export const zona = async (req, res) => res.json(await s.asignarZona(req.usuario, idParam(req.params.id), req.body ?? {}));
export const eliminar = async (req, res) => { await s.eliminar(req.usuario, idParam(req.params.id)); res.status(204).end(); };
