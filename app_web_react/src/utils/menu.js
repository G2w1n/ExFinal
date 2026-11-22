// src/utils/menu.js
// El menú se arma con los roles del usuario (usuario_rol): solo ve las apps y opciones que le tocan
export const MODULOS = {
  transandino: { nombre: 'TransAndino', color: 'ta' },
  aeropuerto: { nombre: 'Aeropuerto Cusco', color: 'aero' },
};

export function armarMenu(usuario) {
  const roles = usuario?.roles ?? {};
  const grupos = [];
  const ta = roles.transandino;
  if (ta) {
    const opciones = ta === 'cliente'
      ? [['/app/transandino/comprar', 'Comprar pasaje'], ['/app/transandino/mis-pasajes', 'Mis pasajes']]
      : [['/app/transandino/panel', 'Panel de pasajes'], ['/app/transandino/comprar', 'Venta presencial']];
    grupos.push({ modulo: 'transandino', rol: ta, opciones });
  }
  const aero = roles.aeropuerto;
  if (aero) {
    let opciones = aero === 'cliente'
      ? [['/app/aeropuerto/reservar', 'Reservar estacionamiento'], ['/app/aeropuerto/mis-reservas', 'Mis reservas']]
      : [['/app/aeropuerto/panel', 'Panel de reservas'], ['/app/aeropuerto/tablero', 'Tablero (arrastrar)'], ['/app/aeropuerto/llegadas', 'Llegadas esperadas']];
    // Integración 2: el administrador de TransAndino es cliente del aeropuerto y reserva espacio para sus buses
    if (ta === 'administrador') opciones = [...opciones, ['/app/aeropuerto/espacio-bus', 'Espacio para buses']];
    grupos.push({ modulo: 'aeropuerto', rol: aero, opciones });
  }
  if (ta === 'cliente' && aero === 'cliente') {
    grupos.push({ modulo: 'viaje', titulo: 'Mi viaje', opciones: [['/app/mis-viajes', 'Mis viajes']] });
  }
  const personal = ['administrador', 'empleado'];
  if (personal.includes(ta) || personal.includes(aero)) {
    const opciones = [['/app/caja', 'Caja']];
    if (personal.includes(aero)) opciones.push(['/app/garita', 'Garita de salida']);
    grupos.push({ modulo: 'ventanilla', titulo: 'Ventanilla', opciones });
  }
  if (personal.includes(ta) || personal.includes(aero)) {
    grupos.push({ modulo: 'crm', titulo: 'CRM', opciones: [['/app/crm', 'Clientes'], ['/app/crm/indicadores', 'Indicadores']] });
  }
  return grupos;
}

export const NOMBRE_ROL = { cliente: 'cliente', administrador: 'administrador', empleado: 'empleado' };
