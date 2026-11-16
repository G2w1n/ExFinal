// src/controllers/pasajes.controller.js
import * as s from '../services/pasajes.service.js';
import { idParam } from '../utils/validaciones.js';

export const rutas = async (_req, res) => res.json(await s.rutas());
export const cotizar = async (req, res) => res.json(s.cotizar(req.body ?? {}));
export const asientos = async (req, res) => res.json(await s.asientos(req.query));
export const comprar = async (req, res) => res.status(201).json(await s.comprar(req.usuario, req.body ?? {}));
export const mios = async (req, res) => res.json(await s.misPasajes(req.usuario));
export const listar = async (req, res) => res.json(await s.listar(req.query));
export const detalle = async (req, res) => res.json(await s.detalle(req.usuario, idParam(req.params.id)));
export const historial = async (req, res) => res.json(await s.historialDe(req.usuario, idParam(req.params.id)));
export const editar = async (req, res) => res.json(await s.editar(req.usuario, idParam(req.params.id), req.body ?? {}));
export const pagar = async (req, res) => res.json(await s.pagar(req.usuario, idParam(req.params.id), req.body ?? {}));
export const cancelar = async (req, res) => res.json(await s.cancelar(req.usuario, idParam(req.params.id)));
export const estado = async (req, res) => res.json(await s.cambiarEstado(req.usuario, idParam(req.params.id), req.body ?? {}));
export const eliminar = async (req, res) => { await s.eliminar(req.usuario, idParam(req.params.id)); res.status(204).end(); };
