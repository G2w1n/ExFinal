// src/routes/caja.routes.js
// Caja (ventanilla): solo personal; cada uno cobra lo de su app
import { Router } from 'express';
import * as c from '../controllers/caja.controller.js';
import { auth } from '../middlewares/auth.js';
import { requirePersonal } from '../middlewares/requireRol.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();
r.use(auth, requirePersonal);
r.get('/', h(c.estado));
r.post('/abrir', h(c.abrir));
r.get('/pendientes', h(c.pendientes));
r.post('/cobrar', h(c.cobrar));
r.post('/cerrar', h(c.cerrar));
export default r;
