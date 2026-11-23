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
