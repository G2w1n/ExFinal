// src/api/servicios.api.js
// Todas las llamadas a la API en un solo lugar (las páginas no usan axios directo)
import { api } from './client.js';

const datos = (promesa) => promesa.then((r) => r.data);

export const authApi = {
  login: (correo, password) => datos(api.post('/auth/login', { correo, password })),
  registro: (cuenta) => datos(api.post('/auth/registro', cuenta)),
};

export const pasajesApi = {
  rutas: () => datos(api.get('/pasajes/rutas')),
  cotizar: (d) => datos(api.post('/pasajes/cotizar', d)),
  disponibilidad: (idRuta, desde) => datos(api.get('/pasajes/disponibilidad', { params: { id_ruta: idRuta, desde, dias: 90 } })),
  asientos: (idRuta, fecha) => datos(api.get('/pasajes/asientos', { params: { id_ruta: idRuta, fecha } })),
  comprar: (d) => datos(api.post('/pasajes', d)),
  mios: () => datos(api.get('/pasajes/mios')),
  listar: (filtros) => datos(api.get('/pasajes', { params: filtros })),
  detalle: (id) => datos(api.get(`/pasajes/${id}`)),
  historial: (id) => datos(api.get(`/pasajes/${id}/historial`)),
  comprobante: (id) => datos(api.get(`/pasajes/${id}/comprobante`)),
  editar: (id, d) => datos(api.put(`/pasajes/${id}`, d)),
  pagar: (id, metodo) => datos(api.post(`/pasajes/${id}/pagar`, { metodo })),
  cancelar: (id) => datos(api.post(`/pasajes/${id}/cancelar`)),
  estado: (id, estado) => datos(api.patch(`/pasajes/${id}/estado`, { estado })),
  eliminar: (id) => datos(api.delete(`/pasajes/${id}`)),
};

export const reservasApi = {
  ocupacion: () => datos(api.get('/reservas/ocupacion')),
  cotizar: (d) => datos(api.post('/reservas/cotizar', d)),
  crear: (d) => datos(api.post('/reservas', d)),
  mias: () => datos(api.get('/reservas/mias')),
  listar: (filtros) => datos(api.get('/reservas', { params: filtros })),
  detalle: (id) => datos(api.get(`/reservas/${id}`)),
  historial: (id) => datos(api.get(`/reservas/${id}/historial`)),
  comprobante: (id) => datos(api.get(`/reservas/${id}/comprobante`)),
  editar: (id, d) => datos(api.put(`/reservas/${id}`, d)),
  pagar: (id, metodo) => datos(api.post(`/reservas/${id}/pagar`, { metodo })),
  cancelar: (id) => datos(api.post(`/reservas/${id}/cancelar`)),
  estado: (id, estado) => datos(api.patch(`/reservas/${id}/estado`, { estado })),
  zona: (id, zona) => datos(api.patch(`/reservas/${id}/zona`, { zona })),
  eliminar: (id) => datos(api.delete(`/reservas/${id}`)),
};

export const integracionesApi = {
  misViajes: () => datos(api.get('/integraciones/mis-viajes')),
  prellenado: (idPasaje) => datos(api.get(`/integraciones/prellenado/${idPasaje}`)),
  espacioBus: (d) => datos(api.post('/integraciones/espacio-bus', d)),
  misBuses: () => datos(api.get('/integraciones/mis-buses')),
  llegadas: (fecha) => datos(api.get('/integraciones/llegadas', { params: { fecha } })),
};

export const notificacionesApi = { listar: () => datos(api.get('/notificaciones')) };

export const crmApi = {
  indicadores: () => datos(api.get('/crm/indicadores')),
  clientes: (filtros) => datos(api.get('/crm/clientes', { params: filtros })),
  ficha: (id) => datos(api.get(`/crm/clientes/${id}`)),
  nota: (id, texto) => datos(api.post(`/crm/clientes/${id}/notas`, { texto })),
};

export const cajaApi = {
  estado: () => datos(api.get('/caja')),
  abrir: (montoInicial) => datos(api.post('/caja/abrir', { monto_inicial: montoInicial })),
  pendientes: (buscar) => datos(api.get('/caja/pendientes', { params: { buscar } })),
  cobrar: (d) => datos(api.post('/caja/cobrar', d)),
  cerrar: (contado, nota) => datos(api.post('/caja/cerrar', { contado, nota })),
};

// Imágenes guardadas en Neon (BYTEA): perfil (privada) y destino (pública)
export const imagenesApi = {
  url: (tipo, id, version) => `${api.defaults.baseURL}/imagenes/${tipo}/${id}${version ? `?v=${version}` : ''}`,
  // Las de perfil piden sesión: se descargan con el token y se muestran como blob
  blob: (tipo, id, version) => datos(api.get(`/imagenes/${tipo}/${id}`, { params: { v: version }, responseType: 'blob' })),
  subir: (tipo, id, blob) => datos(api.put(`/imagenes/${tipo}/${id}`, blob, { headers: { 'Content-Type': blob.type } })),
  borrar: (tipo, id) => api.delete(`/imagenes/${tipo}/${id}`),
};
imagenesApi.catalogo = () => datos(api.get('/imagenes'));
imagenesApi.ejemplos = (reemplazar = false) => datos(api.post('/imagenes/ejemplos', { reemplazar }));
