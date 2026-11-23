// Funciones puras: formato, menú por roles, esquemas de formularios y recorridos del mapa
import { describe, expect, it } from 'vitest';
import { fechaHora, hora, soles } from '../utils/formato.js';
import { armarMenu } from '../utils/menu.js';
import { esquemaLogin, esquemaPlaca, esquemaRegistro, fuerzaClave } from '../utils/esquemas.js';
import { avance, camino, puntoEn } from '../mapa/rutas.js';
import { normalizar } from '../utils/texto.js';

describe('formato', () => {
  it('muestra la fecha de Perú sin cambiar la hora', () => {
    expect(fechaHora('2026-11-08 15:30:00')).toBe('08/11/2026 15:30');
    expect(hora('2026-11-08 07:05:00')).toBe('07:05');
  });
  it('formatea soles', () => expect(soles(85)).toMatch(/S\/\s?85\.00/));
  it('busca sin tildes ni mayúsculas', () => expect(normalizar('Árbol Cusco')).toBe('arbol cusco'));
});

describe('menú según los roles (usuario_rol)', () => {
  const titulos = (u) => armarMenu(u).map((g) => g.titulo ?? g.modulo);
  it('el pasajero ve las 2 apps y Mis viajes', () => {
    expect(titulos({ roles: { transandino: 'cliente', aeropuerto: 'cliente' } })).toEqual(['transandino', 'aeropuerto', 'Mi viaje']);
  });
  it('el admin de TransAndino es cliente del aeropuerto y reserva espacio para buses', () => {
    const menu = armarMenu({ roles: { transandino: 'administrador', aeropuerto: 'cliente' } });
    expect(menu.find((g) => g.modulo === 'aeropuerto').opciones.map(([r]) => r)).toContain('/app/aeropuerto/espacio-bus');
    expect(titulos({ roles: { transandino: 'administrador', aeropuerto: 'cliente' } })).toContain('CRM');
  });
  it('el empleado del aeropuerto tiene garita y no ve TransAndino', () => {
    const menu = armarMenu({ roles: { aeropuerto: 'empleado' } });
    expect(menu.map((g) => g.modulo)).not.toContain('transandino');
    expect(menu.find((g) => g.modulo === 'ventanilla').opciones.map(([r]) => r)).toContain('/app/garita');
  });
});

describe('esquemas de formularios (Zod)', () => {
  it('valida el login', () => {
    expect(esquemaLogin.safeParse({ correo: 'x', password: '' }).success).toBe(false);
    expect(esquemaLogin.safeParse({ correo: 'a@b.pe', password: '1' }).success).toBe(true);
  });
  it('exige que las contraseñas coincidan', () => {
    const r = esquemaRegistro.safeParse({ nombre: 'Ana', correo: 'a@b.pe', password: '123456', confirmar: '12345', dni: '', celular: '' });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].path).toEqual(['confirmar']);
  });
  it('normaliza la placa', () => {
    expect(esquemaPlaca.parse(' abc-123 ')).toBe('ABC-123');
    expect(esquemaPlaca.safeParse('AB-12').success).toBe(false);
  });
  it('mide la fuerza de la contraseña', () => {
    expect(fuerzaClave('123')).toBe(0);
    expect(fuerzaClave('Clave-Segura-2026')).toBe(4);
  });
});

describe('recorrido del bus en el mapa', () => {
  it('la ruta de vuelta es la de ida al revés', () => {
    expect(camino('Cusco', 'Lima')).toEqual([...camino('Lima', 'Cusco')].reverse());
  });
  it('el punto al 0 % y al 100 % son los extremos', () => {
    const puntos = camino('Arequipa', 'Cusco');
    expect(puntoEn(puntos, 0)).toEqual(puntos[0]);
    expect(puntoEn(puntos, 1)).toEqual(puntos[puntos.length - 1]);
  });
  it('calcula el avance del viaje con la hora', () => {
    expect(avance('2026-11-15 20:00:00', '2026-11-16 15:00:00', '2026-11-16T05:30')).toBeCloseTo(0.5, 2);
    expect(avance('2026-11-15 20:00:00', '2026-11-16 15:00:00', '2026-11-14T00:00')).toBe(0);
  });
});

describe('imágenes', async () => {
  const { kb } = await import('../utils/imagen.js');
  it('muestra el peso en KB o MB', () => {
    expect(kb(48 * 1024)).toBe('48 KB');
    expect(kb(3.2 * 1024 * 1024)).toBe('3.2 MB');
  });
  it('los administradores ven Fotos de la página y el empleado no', () => {
    const menu = armarMenu({ roles: { transandino: 'administrador', aeropuerto: 'cliente' } });
    expect(menu.find((g) => g.modulo === 'transandino').opciones.map(([r]) => r)).toContain('/app/fotos');
    expect(armarMenu({ roles: { aeropuerto: 'administrador' } })[0].opciones.map(([r]) => r)).toContain('/app/fotos');
    expect(armarMenu({ roles: { transandino: 'empleado' } })[0].opciones.map(([r]) => r)).not.toContain('/app/fotos');
  });
});
