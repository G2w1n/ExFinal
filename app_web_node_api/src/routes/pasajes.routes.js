// src/routes/pasajes.routes.js
// Módulo TransAndino: Registro (comprar) · Consulta (mis pasajes) · Actualizar (editar) · Panel CRUD
import { Router } from 'express';
import * as c from '../controllers/pasajes.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const personal = requireRol('transandino', 'administrador', 'empleado');
const r = Router();
r.get('/rutas', h(c.rutas));
r.post('/cotizar', h(c.cotizar));
r.get('/asientos', h(c.asientos));
r.use(auth);
r.post('/', h(c.comprar));
r.get('/mios', h(c.mios));
r.get('/', personal, h(c.listar));
r.get('/:id', h(c.detalle));
r.get('/:id/historial', h(c.historial));
r.get('/:id/comprobante', h(c.comprobante));
r.put('/:id', h(c.editar));
r.post('/:id/pagar', h(c.pagar));
r.post('/:id/cancelar', h(c.cancelar));
r.patch('/:id/estado', personal, h(c.estado));
r.delete('/:id', requireRol('transandino', 'administrador'), h(c.eliminar));
export default r;
