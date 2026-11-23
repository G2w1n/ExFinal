// src/utils/imagen.js
// Achica la foto en el navegador antes de subirla: de 3–5 MB a ~50 KB (WebP), así cabe de sobra en Neon
export const MAXIMO_BYTES = 300 * 1024;
export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'];

async function cargar(archivo) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(archivo, { imageOrientation: 'from-image' }); } catch { /* sigue con <img> */ }
  }
  const url = URL.createObjectURL(archivo);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally { URL.revokeObjectURL(url); }
}

const aBlob = (lienzo, tipo, calidad) => new Promise((ok) => lienzo.toBlob(ok, tipo, calidad));

// Recorta al centro con la proporción pedida (1 = cuadrada, 16/9 = banner) y baja la calidad hasta que pese poco
export async function achicarImagen(archivo, { ancho = 600, proporcion = 1, objetivo = 120 * 1024 } = {}) {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) throw new Error('Elige una imagen JPG, PNG o WebP.');
  if (archivo.size > 15 * 1024 * 1024) throw new Error('La imagen pesa más de 15 MB.');
  const img = await cargar(archivo);
  const ow = img.width; const oh = img.height;
  let sw = ow; let sh = Math.round(ow / proporcion);
  if (sh > oh) { sh = oh; sw = Math.round(oh * proporcion); }
  const sx = Math.round((ow - sw) / 2); const sy = Math.round((oh - sh) / 2);
  const w = Math.min(ancho, sw); const h = Math.round(w / proporcion);
  const lienzo = document.createElement('canvas');
  lienzo.width = w; lienzo.height = h;
  const ctx = lienzo.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  img.close?.();

  let blob = null;
  for (const calidad of [0.85, 0.75, 0.62, 0.5]) {
    blob = await aBlob(lienzo, 'image/webp', calidad);
    // Navegadores sin WebP devuelven PNG: en ese caso se usa JPEG
    if (!blob || blob.type !== 'image/webp') blob = await aBlob(lienzo, 'image/jpeg', calidad);
    if (blob.size <= objetivo) break;
  }
  if (blob.size > MAXIMO_BYTES) throw new Error('No se pudo achicar la imagen lo suficiente. Prueba con otra.');
  return { blob, ancho: w, alto: h, original: archivo.size };
}

export const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
