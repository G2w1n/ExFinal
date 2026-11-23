// src/services/imagenes.service.js
// Reglas de las imágenes: quién puede subir cada tipo, formato real del archivo y tamaño máximo
import fs from 'node:fs/promises';
import * as repo from '../repositories/imagenes.repository.js';
import { ruta as buscarRuta, rutas as listarRutas } from '../repositories/pasajes.repository.js';
import { tieneRol, esPersonal } from '../middlewares/requireRol.js';
import { AppError } from '../utils/AppError.js';
import { numero } from '../utils/validaciones.js';

export const MAXIMO = 300 * 1024; // 300 KB (el navegador las achica a ~50 KB antes de subirlas)
const TIPOS = ['perfil', 'destino', 'escena'];
const esAdmin = (u) => tieneRol(u, 'transandino', 'administrador') || tieneRol(u, 'aeropuerto', 'administrador');

// Fotos de la página (tipo 'escena'): el id es fijo. Del 11 en adelante son paisajes para la galería de la portada.
export const ESCENAS = {
  1: 'Aeropuerto del Cusco', 2: 'Estacionamiento', 3: 'Auto', 4: 'Bus',
  11: 'Machu Picchu', 12: 'Montaña de 7 colores', 13: 'Valle Sagrado', 14: 'Huacachina', 15: 'Sacsayhuamán', 16: 'Arequipa y el Misti',
};

// El formato se comprueba por los primeros bytes del archivo, no por lo que diga el navegador
export function formatoReal(b) {
  if (b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'image/png';
  return null;
}

function leer(tipo, id) {
  if (!TIPOS.includes(tipo)) throw new AppError(404, 'Ese tipo de imagen no existe.');
  return numero(id, 'El identificador', { min: 1, entero: true });
}

// perfil: solo la propia persona · destino: solo el administrador de TransAndino · escena: cualquier administrador
async function revisarPermiso(usuario, tipo, id) {
  if (tipo === 'escena') {
    if (!esAdmin(usuario)) throw new AppError(403, 'Solo un administrador cambia las fotos de la página.');
    if (!ESCENAS[id]) throw new AppError(404, 'Esa foto de la página no existe.');
  }
  if (tipo === 'perfil' && id !== usuario.id) throw new AppError(403, 'Solo puedes cambiar tu propia foto.');
  if (tipo === 'destino') {
    if (!tieneRol(usuario, 'transandino', 'administrador')) throw new AppError(403, 'Solo el administrador de TransAndino cambia las fotos de los destinos.');
    if (!(await buscarRuta(id))) throw new AppError(404, 'Esa ruta no existe.');
  }
}

// Las fotos de destinos son públicas; la de perfil la ve su dueño o el personal (CRM)
export async function ver(usuario, tipo, idTexto) {
  const id = leer(tipo, idTexto);
  if (tipo === 'perfil' && (!usuario || (usuario.id !== id && !esPersonal(usuario)))) {
    throw usuario ? new AppError(403, 'Esa foto de perfil es privada.') : new AppError(401, 'Inicia sesión para ver esta foto.');
  }
  if (tipo === 'escena' && !ESCENAS[id]) throw new AppError(404, 'Esa foto de la página no existe.');
  const img = await repo.obtener(tipo, id);
  if (!img) throw new AppError(404, 'Todavía no hay foto.');
  return img;
}

export async function subir(usuario, tipo, idTexto, cuerpo) {
  const id = leer(tipo, idTexto);
  await revisarPermiso(usuario, tipo, id);
  if (!Buffer.isBuffer(cuerpo) || cuerpo.length === 0) throw new AppError(400, 'Envía una imagen JPG, PNG o WebP.');
  if (cuerpo.length > MAXIMO) throw new AppError(413, 'La imagen pesa más de 300 KB.');
  const mime = formatoReal(cuerpo);
  if (!mime) throw new AppError(415, 'El archivo no es una imagen JPG, PNG o WebP.');
  const r = await repo.guardar({ tipo, id, mime, datos: cuerpo, idAutor: usuario.id });
  return { tipo, id, version: Number(r.version), bytes: r.bytes };
}

export async function borrar(usuario, tipo, idTexto) {
  const id = leer(tipo, idTexto);
  await revisarPermiso(usuario, tipo, id);
  if (!(await repo.borrar(tipo, id))) throw new AppError(404, 'No había foto que quitar.');
}

export const catalogo = async () => ({ escenas: ESCENAS, fotos: await repo.catalogo() });

// Fotos de ejemplo incluidas en el proyecto (database/fotos): libres, ya achicadas a WebP, con su autor y licencia.
// Llena solo las que faltan (o todas con reemplazar = true). Sirve para el botón de la app y para "npm run db:init".
const CARPETA = new URL('../../database/fotos/', import.meta.url);

export async function cargarEjemplos(usuario, { reemplazar = false } = {}) {
  if (usuario && !esAdmin(usuario)) throw new AppError(403, 'Solo un administrador carga las fotos de ejemplo.');
  const guia = JSON.parse(await fs.readFile(new URL('fotos.json', CARPETA), 'utf8'));
  const leer = (clave) => fs.readFile(new URL(`${clave}.webp`, CARPETA));
  const resultado = { escenas: 0, destinos: 0, omitidas: 0 };

  const yaEscenas = reemplazar ? new Set() : await repo.existentes('escena');
  for (const [id, clave] of Object.entries(guia.escenas)) {
    if (yaEscenas.has(Number(id))) { resultado.omitidas += 1; continue; }
    await repo.guardar({ tipo: 'escena', id: Number(id), mime: 'image/webp', datos: await leer(clave), idAutor: usuario?.id ?? null, credito: guia.creditos[clave] });
    resultado.escenas += 1;
  }

  // Cada ruta recibe una foto de su ciudad de destino; si hay varias rutas a la misma ciudad, se turnan
  const yaDestinos = reemplazar ? new Set() : await repo.existentes('destino');
  const turno = {};
  for (const r of await listarRutas()) {
    const opciones = guia.destinos[r.destino];
    if (!opciones?.length) continue;
    const clave = opciones[(turno[r.destino] = (turno[r.destino] ?? -1) + 1) % opciones.length];
    if (yaDestinos.has(r.id)) { resultado.omitidas += 1; continue; }
    await repo.guardar({ tipo: 'destino', id: r.id, mime: 'image/webp', datos: await leer(clave), idAutor: usuario?.id ?? null, credito: guia.creditos[clave] });
    resultado.destinos += 1;
  }
  return resultado;
}
