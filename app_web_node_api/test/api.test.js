// test/api.test.js — rutas que no tocan la base de datos: documentación Swagger, CORS y rutas protegidas
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { app, origenPermitido } from '../src/app.js';
import { openapi } from '../src/docs/openapi.js';
import { pool } from '../src/config/db.js';

const servidor = app.listen(0);
const base = `http://localhost:${servidor.address().port}/api`;
after(() => { servidor.close(); pool.end(); });

test('la especificación OpenAPI documenta las rutas principales', () => {
  assert.equal(openapi.openapi.startsWith('3.'), true);
  for (const ruta of ['/auth/login', '/pasajes', '/reservas', '/caja/cobrar', '/crm/indicadores']) {
    assert.ok(Object.keys(openapi.paths).some((p) => p.startsWith(ruta)), `falta ${ruta}`);
  }
});

test('GET /api/docs.json responde la especificación', async () => {
  const r = await fetch(`${base}/docs.json`);
  assert.equal(r.status, 200);
  assert.ok(Object.keys((await r.json()).paths).length > 30);
});

test('una ruta privada sin token responde 401 con mensaje', async () => {
  const r = await fetch(`${base}/pasajes/mios`);
  assert.equal(r.status, 401);
  assert.ok((await r.json()).mensaje);
});

test('CORS acepta el origen configurado y rechaza otros', () => {
  assert.equal(origenPermitido(undefined), true);
  assert.equal(origenPermitido('http://localhost:5173'), true);
  assert.equal(origenPermitido('https://sitio-malicioso.com'), false);
});

test('imágenes: reconoce el formato real por sus primeros bytes', async () => {
  const { formatoReal } = await import('../src/services/imagenes.service.js');
  assert.equal(formatoReal(Buffer.from('89504e470d0a1a0a0000000d', 'hex')), 'image/png');
  assert.equal(formatoReal(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])), 'image/jpeg');
  assert.equal(formatoReal(Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'binary')), 'image/webp');
  assert.equal(formatoReal(Buffer.from('<svg onload=alert(1)>')), null);
});

test('subir una imagen sin sesión responde 401', async () => {
  const r = await fetch(`${base}/imagenes/perfil/1`, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: new Uint8Array([1, 2, 3]) });
  assert.equal(r.status, 401);
});
