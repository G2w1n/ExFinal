// src/controllers/caja.controller.js
import * as s from '../services/caja.service.js';

export const estado = async (req, res) => res.json(await s.estado(req.usuario));
export const abrir = async (req, res) => res.status(201).json(await s.abrir(req.usuario, req.body ?? {}));
export const pendientes = async (req, res) => res.json(await s.pendientes(req.usuario, req.query));
export const cobrar = async (req, res) => res.status(201).json(await s.cobrar(req.usuario, req.body ?? {}));
export const cerrar = async (req, res) => res.json(await s.cerrar(req.usuario, req.body ?? {}));
