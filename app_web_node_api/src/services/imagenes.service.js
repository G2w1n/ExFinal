// src/services/imagenes.service.js
// Reglas de las imágenes: quién puede subir cada tipo, formato real del archivo y tamaño máximo
import * as repo from '../repositories/imagenes.repository.js';
import { ruta as buscarRuta } from '../repositories/pasajes.repository.js';
import { tieneRol, esPersonal } from '../middlewares/requireRol.js';
import { AppError } from '../utils/AppError.js';
import { numero } from '../utils/validaciones.js';

export const MAXIMO = 300 * 1024; // 300 KB (el navegador las achica a ~50 KB antes de subirlas)
const TIPOS = ['perfil', 'destino'];

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

// perfil: solo la propia persona · destino: solo el administrador de TransAndino
async function revisarPermiso(usuario, tipo, id) {
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
