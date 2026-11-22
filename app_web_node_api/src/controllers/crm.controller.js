// src/controllers/crm.controller.js
import * as s from '../services/crm.service.js';
import { idParam } from '../utils/validaciones.js';

export const indicadores = async (_req, res) => res.json(await s.indicadores());
export const notificaciones = async (req, res) => res.json(await s.notificaciones(req.usuario));
export const clientes = async (req, res) => res.json(await s.clientes(req.query));
export const ficha = async (req, res) => res.json(await s.ficha(idParam(req.params.id)));
export const nota = async (req, res) => res.status(201).json(await s.agregarNota(req.usuario, idParam(req.params.id), req.body ?? {}));
