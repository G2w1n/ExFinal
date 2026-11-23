// src/controllers/imagenes.controller.js
import * as s from '../services/imagenes.service.js';

export async function ver(req, res) {
  const img = await s.ver(req.usuario, req.params.tipo, req.params.id);
  const etiqueta = `"${img.version}"`;
  // Con ?v=<versión> el navegador la guarda en caché; al cambiar la foto cambia la versión
  res.set({
    'Content-Type': img.mime,
    ETag: etiqueta,
    'Cache-Control': `${req.params.tipo === 'perfil' ? 'private' : 'public'}, max-age=${req.query.v ? 31536000 : 60}`,
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.headers['if-none-match'] === etiqueta) return res.status(304).end();
  res.send(img.datos);
}

export const subir = async (req, res) => res.status(201).json(await s.subir(req.usuario, req.params.tipo, req.params.id, req.body));
export const borrar = async (req, res) => { await s.borrar(req.usuario, req.params.tipo, req.params.id); res.status(204).end(); };
export const catalogo = async (_req, res) => res.json(await s.catalogo());
export const ejemplos = async (req, res) => res.status(201).json(await s.cargarEjemplos(req.usuario, { reemplazar: req.body?.reemplazar === true }));
