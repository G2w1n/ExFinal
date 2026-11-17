// src/routes/reservas.routes.js
// Módulo Aeropuerto: Registro (reservar) · Consulta (mis reservas) · Actualizar (editar) · Panel CRUD
import { Router } from 'express';
import * as c from '../controllers/reservas.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const personal = requireRol('aeropuerto', 'administrador', 'empleado');
const r = Router();
r.get('/ocupacion', h(c.ocupacion));
r.post('/cotizar', h(c.cotizar));
r.use(auth);
r.post('/', h(c.crear));
r.get('/mias', h(c.mias));
r.get('/', personal, h(c.listar));
r.get('/:id', h(c.detalle));
r.get('/:id/historial', h(c.historial));
r.get('/:id/comprobante', h(c.comprobante));
r.put('/:id', h(c.editar));
r.post('/:id/pagar', h(c.pagar));
r.post('/:id/cancelar', h(c.cancelar));
r.patch('/:id/estado', personal, h(c.estado));
r.patch('/:id/zona', personal, h(c.zona));
r.delete('/:id', requireRol('aeropuerto', 'administrador'), h(c.eliminar));
export default r;
