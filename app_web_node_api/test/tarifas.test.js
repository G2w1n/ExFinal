// test/tarifas.test.js — "npm test": reglas de precio de los dos módulos (no necesitan base de datos)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cotizarEstacionamiento, cotizarPasaje, sumarHoras, tipoDeAsiento } from '../src/utils/tarifas.js';

test('asientos 1–12 son cama y 13–40 semicama', () => {
  assert.equal(tipoDeAsiento(12), 'cama');
  assert.equal(tipoDeAsiento(13), 'semicama');
});

test('pasaje: base por tipo de asiento y S/ 4 por kg sobre 20', () => {
  assert.equal(cotizarPasaje({ asiento: 3, equipaje_kg: 20 }).total, 85);
  assert.equal(cotizarPasaje({ asiento: 30, equipaje_kg: 25 }).total, 80);
});

test('estacionamiento: hora o fracción, VIP y bus', () => {
  // Martes 10:00, 3.5 h -> 4 h × S/ 7 + VIP
  assert.equal(cotizarEstacionamiento({ horas: 3.5, fecha_hora_entrada: '2026-11-17 10:00:00', zona_vip: true }).total, 43);
  // Bus: +50 %
  assert.equal(cotizarEstacionamiento({ horas: 2, fecha_hora_entrada: '2026-11-17 06:00:00', tipo: 'bus' }).total, 21);
});

test('estacionamiento: tope diario, nocturna y fin de semana', () => {
  assert.equal(cotizarEstacionamiento({ horas: 12, fecha_hora_entrada: '2026-11-17 08:00:00' }).total, 60);
  assert.equal(cotizarEstacionamiento({ horas: 6, fecha_hora_entrada: '2026-11-17 23:00:00' }).total, 20);
  // Sábado: -10 %
  assert.equal(cotizarEstacionamiento({ horas: 2, fecha_hora_entrada: '2026-11-21 10:00:00' }).total, 12.6);
});

test('sumarHoras cruza el día sin zonas horarias', () => {
  assert.equal(sumarHoras('2026-11-15 20:00:00', 19), '2026-11-16 15:00:00');
});
