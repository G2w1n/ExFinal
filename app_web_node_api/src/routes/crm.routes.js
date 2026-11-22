// src/routes/crm.routes.js
// CRM: solo para el personal (administrador o empleado de cualquiera de las dos apps)
import { Router } from 'express';
import * as c from '../controllers/crm.controller.js';
import { auth } from '../middlewares/auth.js';
import { requirePersonal } from '../middlewares/requireRol.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

// Notificaciones: cualquier usuario con sesión (cada uno ve lo suyo)
export const notificacionesRoutes = Router();
notificacionesRoutes.get('/', auth, h(c.notificaciones));

const r = Router();
r.use(auth, requirePersonal);
r.get('/indicadores', h(c.indicadores));
r.get('/clientes', h(c.clientes));
r.get('/clientes/:id', h(c.ficha));
r.post('/clientes/:id/notas', h(c.nota));
export default r;
