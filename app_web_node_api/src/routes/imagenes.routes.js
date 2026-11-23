// src/routes/imagenes.routes.js
// GET /api/imagenes/:tipo/:id   -> la imagen (destino: pública · perfil: dueño o personal)
// PUT /api/imagenes/:tipo/:id   -> sube o reemplaza (cuerpo binario: image/webp, image/jpeg o image/png)
// DELETE /api/imagenes/:tipo/:id
import express, { Router } from 'express';
import * as c from '../controllers/imagenes.controller.js';
import { auth, authOpcional } from '../middlewares/auth.js';
import { MAXIMO } from '../services/imagenes.service.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const binario = express.raw({ type: ['image/webp', 'image/jpeg', 'image/png'], limit: MAXIMO });

const r = Router();
r.get('/', h(c.catalogo));                       // qué fotos públicas hay (sin los bytes)
r.post('/ejemplos', auth, h(c.ejemplos)); // cargar las fotos de ejemplo (administradores)
r.get('/:tipo/:id', authOpcional, h(c.ver));
r.put('/:tipo/:id', auth, binario, h(c.subir));
r.delete('/:tipo/:id', auth, h(c.borrar));
export default r;
