// src/controllers/integraciones.controller.js
import * as s from '../services/integraciones.service.js';
import { crearEspacioBus } from '../services/reservas.service.js';

export const misViajes = async (req, res) => res.json(await s.misViajes(req.usuario));
export const prellenado = async (req, res) => res.json(await s.prellenado(req.usuario, req.params.idPasaje));
export const espacioBus = async (req, res) => res.status(201).json(await crearEspacioBus(req.usuario, req.body ?? {}));
export const misBuses = async (req, res) => res.json(await s.misBuses(req.usuario));
export const llegadas = async (req, res) => res.json(await s.llegadas(req.query.fecha));
