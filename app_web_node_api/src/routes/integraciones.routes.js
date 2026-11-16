// src/routes/integraciones.routes.js
// Las 3 funcionalidades que unen TransAndino y el Aeropuerto
import { Router } from 'express';
import * as c from '../controllers/integraciones.controller.js';
import { auth } from '../middlewares/auth.js';
import { requireRol } from '../middlewares/requireRol.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const r = Router();
r.use(auth);
r.get('/mis-viajes', h(c.misViajes));                                   // HU-15.1 · HU-15.4
r.get('/prellenado/:idPasaje', h(c.prellenado));                         // HU-15.1
r.post('/espacio-bus', requireRol('transandino', 'administrador'), h(c.espacioBus));   // HU-15.2
r.get('/mis-buses', requireRol('transandino', 'administrador'), h(c.misBuses));       // HU-15.2
r.get('/llegadas', requireRol('aeropuerto', 'administrador', 'empleado'), h(c.llegadas)); // HU-15.3
export default r;
