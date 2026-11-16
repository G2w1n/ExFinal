// src/controllers/auth.controller.js
// Recibe la petición, llama al servicio y responde JSON
import * as servicio from '../services/auth.service.js';

export const login = async (req, res) => res.json(await servicio.login(req.body ?? {}));
export const registro = async (req, res) => res.status(201).json(await servicio.registrar(req.body ?? {}));
export const yo = async (req, res) => res.json(await servicio.perfil(req.usuario.id));
