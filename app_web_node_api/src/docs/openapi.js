// src/docs/openapi.js
// Documentación de la API (OpenAPI 3) que muestra Swagger UI en /api/docs.
// Desde ahí se puede iniciar sesión, pegar el token en "Authorize" y probar cada ruta.
const json = (schema) => ({ 'application/json': { schema } });
const cuerpo = (propiedades, requeridas = []) => ({ required: true, content: json({ type: 'object', properties: propiedades, required: requeridas }) });
const ok = (descripcion = 'Correcto') => ({ 200: { description: descripcion } });
const errores = { 400: { description: 'Datos no válidos' }, 401: { description: 'Sin sesión' }, 403: { description: 'Sin permiso (rol)' }, 404: { description: 'No existe' }, 409: { description: 'Estado no permitido o ya existe' } };
const id = [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }];
const query = (...nombres) => nombres.map((n) => ({ name: n, in: 'query', schema: { type: 'string' } }));
const conSesion = [{ bearer: [] }];
const op = (tag, summary, extra = {}) => ({ tags: [tag], summary, responses: { ...ok(), ...errores }, ...extra });

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'API Grupo 15 · Viaje a Cusco',
    version: '1.0.0',
    description: 'TransAndino (pasajes) + Aeropuerto Internacional del Cusco (estacionamiento) + CRM.\n\n'
      + '1. Usa **POST /auth/login** con `cliente1@correo.com` / `123456` (o una cuenta del personal).\n'
      + '2. Copia el `token`, pulsa **Authorize** y pégalo.\n'
      + 'Los errores siempre tienen la forma `{ "mensaje": "…" }`.',
  },
  servers: [{ url: '/api' }],
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  tags: [
    { name: 'Sesión' }, { name: 'TransAndino · pasajes' }, { name: 'Aeropuerto · reservas' },
    { name: 'Integraciones' }, { name: 'Caja' }, { name: 'CRM' }, { name: 'Imágenes' }, { name: 'Sistema' },
  ],
  paths: {
    '/salud': { get: op('Sistema', 'Estado de la API y de la base de datos') },
    '/auth/login': { post: op('Sesión', 'Iniciar sesión (devuelve el token JWT)', { requestBody: cuerpo({ correo: { type: 'string', example: 'cliente1@correo.com' }, password: { type: 'string', example: '123456' } }, ['correo', 'password']) }) },
    '/auth/registro': { post: op('Sesión', 'Crear cuenta (cliente en las dos apps)', { requestBody: cuerpo({ nombre: { type: 'string' }, correo: { type: 'string' }, password: { type: 'string' }, dni: { type: 'string' }, celular: { type: 'string' } }, ['nombre', 'correo', 'password']) }) },
    '/auth/yo': { get: op('Sesión', 'Mi cuenta y mis roles', { security: conSesion }) },

    '/pasajes/rutas': { get: op('TransAndino · pasajes', 'Rutas y horarios (público)') },
    '/pasajes/asientos': { get: op('TransAndino · pasajes', 'Asientos ocupados de un viaje', { parameters: query('id_ruta', 'fecha') }) },
    '/pasajes/disponibilidad': { get: op('TransAndino · pasajes', 'Asientos vendidos por día (calendario)', { parameters: query('id_ruta', 'desde', 'dias') }) },
    '/pasajes/cotizar': { post: op('TransAndino · pasajes', 'Precio calculado en el servidor', { requestBody: cuerpo({ asiento: { type: 'integer', example: 3 }, equipaje_kg: { type: 'number', example: 25 } }) }) },
    '/pasajes': {
      post: op('TransAndino · pasajes', 'Comprar pasaje (el personal puede vender con correo_cliente)', { security: conSesion, requestBody: cuerpo({ id_ruta: { type: 'integer', example: 1 }, fecha: { type: 'string', example: '2026-12-20' }, asiento: { type: 'integer', example: 15 }, equipaje_kg: { type: 'number', example: 18 }, correo_cliente: { type: 'string' } }, ['id_ruta', 'fecha', 'asiento']) }),
      get: op('TransAndino · pasajes', 'Panel: listar pasajes (personal TransAndino)', { security: conSesion, parameters: query('buscar', 'estado', 'fecha') }),
    },
    '/pasajes/mios': { get: op('TransAndino · pasajes', 'Mis pasajes', { security: conSesion }) },
    '/pasajes/{id}': {
      get: op('TransAndino · pasajes', 'Detalle (dueño o personal)', { security: conSesion, parameters: id }),
      put: op('TransAndino · pasajes', 'Editar antes de pagar', { security: conSesion, parameters: id, requestBody: cuerpo({ id_ruta: { type: 'integer' }, fecha: { type: 'string' }, asiento: { type: 'integer' }, equipaje_kg: { type: 'number' } }) }),
      delete: op('TransAndino · pasajes', 'Eliminar (administrador TransAndino)', { security: conSesion, parameters: id }),
    },
    '/pasajes/{id}/pagar': { post: op('TransAndino · pasajes', 'Pagar en línea', { security: conSesion, parameters: id, requestBody: cuerpo({ metodo: { type: 'string', enum: ['tarjeta', 'billetera', 'efectivo'] } }, ['metodo']) }) },
    '/pasajes/{id}/cancelar': { post: op('TransAndino · pasajes', 'Cancelar', { security: conSesion, parameters: id }) },
    '/pasajes/{id}/estado': { patch: op('TransAndino · pasajes', 'Personal: abordado o cancelado', { security: conSesion, parameters: id, requestBody: cuerpo({ estado: { type: 'string', enum: ['abordado', 'cancelado'] } }, ['estado']) }) },
    '/pasajes/{id}/historial': { get: op('TransAndino · pasajes', 'Trazabilidad: quién y cuándo', { security: conSesion, parameters: id }) },
    '/pasajes/{id}/comprobante': { get: op('TransAndino · pasajes', 'Comprobante (pasaje pagado)', { security: conSesion, parameters: id }) },

    '/reservas/ocupacion': { get: op('Aeropuerto · reservas', 'Ocupación actual por zona (público)') },
    '/reservas/cotizar': { post: op('Aeropuerto · reservas', 'Tarifa calculada en el servidor', { requestBody: cuerpo({ horas: { type: 'number', example: 6 }, fecha_hora_entrada: { type: 'string', example: '2026-12-20T15:30' }, tipo: { type: 'string', enum: ['auto', 'bus'] }, zona_vip: { type: 'boolean' } }) }) },
    '/reservas': {
      post: op('Aeropuerto · reservas', 'Reservar (con id_pasaje se enlaza al pasaje)', { security: conSesion, requestBody: cuerpo({ placa: { type: 'string', example: 'ABC-123' }, fecha_hora_entrada: { type: 'string', example: '2026-12-21T07:30' }, horas: { type: 'number', example: 8 }, zona_vip: { type: 'boolean' }, id_pasaje: { type: 'integer' } }, ['placa', 'fecha_hora_entrada', 'horas']) }),
      get: op('Aeropuerto · reservas', 'Panel: listar reservas (personal Aeropuerto)', { security: conSesion, parameters: query('buscar', 'estado', 'tipo', 'fecha') }),
    },
    '/reservas/mias': { get: op('Aeropuerto · reservas', 'Mis reservas', { security: conSesion }) },
    '/reservas/{id}': {
      get: op('Aeropuerto · reservas', 'Detalle', { security: conSesion, parameters: id }),
      put: op('Aeropuerto · reservas', 'Editar antes de pagar', { security: conSesion, parameters: id }),
      delete: op('Aeropuerto · reservas', 'Eliminar (administrador Aeropuerto)', { security: conSesion, parameters: id }),
    },
    '/reservas/{id}/pagar': { post: op('Aeropuerto · reservas', 'Pagar en línea', { security: conSesion, parameters: id, requestBody: cuerpo({ metodo: { type: 'string', enum: ['tarjeta', 'billetera', 'efectivo'] } }, ['metodo']) }) },
    '/reservas/{id}/cancelar': { post: op('Aeropuerto · reservas', 'Cancelar', { security: conSesion, parameters: id }) },
    '/reservas/{id}/estado': { patch: op('Aeropuerto · reservas', 'Personal: preparado, finalizado o cancelado', { security: conSesion, parameters: id, requestBody: cuerpo({ estado: { type: 'string', enum: ['preparado', 'finalizado', 'cancelado'] } }, ['estado']) }) },
    '/reservas/{id}/zona': { patch: op('Aeropuerto · reservas', 'Personal: asignar zona', { security: conSesion, parameters: id, requestBody: cuerpo({ zona: { type: 'string', example: 'B' } }, ['zona']) }) },
    '/reservas/{id}/historial': { get: op('Aeropuerto · reservas', 'Trazabilidad', { security: conSesion, parameters: id }) },
    '/reservas/{id}/comprobante': { get: op('Aeropuerto · reservas', 'Comprobante con QR (reserva pagada)', { security: conSesion, parameters: id }) },

    '/integraciones/mis-viajes': { get: op('Integraciones', 'HU-15.1/15.4 · pasaje + estacionamiento (JOIN)', { security: conSesion }) },
    '/integraciones/prellenado/{idPasaje}': { get: op('Integraciones', 'HU-15.1 · datos precargados para reservar', { security: conSesion, parameters: [{ name: 'idPasaje', in: 'path', required: true, schema: { type: 'integer' } }] }) },
    '/integraciones/espacio-bus': { post: op('Integraciones', 'HU-15.2 · espacio para buses (admin TransAndino)', { security: conSesion }) },
    '/integraciones/mis-buses': { get: op('Integraciones', 'HU-15.2 · mis reservas de buses', { security: conSesion }) },
    '/integraciones/llegadas': { get: op('Integraciones', 'HU-15.3 · llegadas esperadas por hora del bus', { security: conSesion, parameters: query('fecha') }) },

    '/caja': { get: op('Caja', 'Estado de mi caja, totales y cobros', { security: conSesion }) },
    '/caja/abrir': { post: op('Caja', 'Abrir con fondo inicial', { security: conSesion, requestBody: cuerpo({ monto_inicial: { type: 'number', example: 100 } }, ['monto_inicial']) }) },
    '/caja/pendientes': { get: op('Caja', 'Pendientes de pago de mis apps', { security: conSesion, parameters: query('buscar') }) },
    '/caja/cobrar': { post: op('Caja', 'Cobrar (efectivo con vuelto, POS o billetera)', { security: conSesion, requestBody: cuerpo({ entidad: { type: 'string', enum: ['pasaje', 'reserva'] }, id: { type: 'integer' }, metodo: { type: 'string', enum: ['efectivo', 'pos', 'billetera'] }, monto_recibido: { type: 'number' } }, ['entidad', 'id', 'metodo']) }) },
    '/caja/cerrar': { post: op('Caja', 'Arqueo y cierre', { security: conSesion, requestBody: cuerpo({ contado: { type: 'number' }, nota: { type: 'string' } }, ['contado']) }) },

    '/notificaciones': { get: op('CRM', 'Notificaciones de mi cuenta', { security: conSesion }) },
    '/crm/indicadores': { get: op('CRM', 'Indicadores, ingresos por día y por medio de pago', { security: conSesion }) },
    '/crm/clientes': { get: op('CRM', 'Clientes por tipo', { security: conSesion, parameters: query('buscar', 'segmento') }) },
    '/crm/clientes/{id}': { get: op('CRM', 'Ficha del cliente', { security: conSesion, parameters: id }) },
    '/crm/clientes/{id}/notas': { post: op('CRM', 'Agregar nota de seguimiento', { security: conSesion, parameters: id, requestBody: cuerpo({ texto: { type: 'string' } }, ['texto']) }) },

    '/imagenes/{tipo}/{id}': {
      parameters: [
        { name: 'tipo', in: 'path', required: true, schema: { type: 'string', enum: ['perfil', 'destino'] } },
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'perfil: id del usuario · destino: id de la ruta' },
      ],
      get: op('Imágenes', 'Ver la imagen guardada en la base (destino: pública · perfil: dueño o personal)', { security: [{}, { bearer: [] }], parameters: query('v'), responses: { 200: { description: 'La imagen', content: { 'image/webp': {}, 'image/jpeg': {}, 'image/png': {} } }, ...errores } }),
      put: op('Imágenes', 'Subir o reemplazar (máx. 300 KB; perfil: la propia · destino: admin de TransAndino)', { security: conSesion, requestBody: { required: true, content: { 'image/webp': { schema: { type: 'string', format: 'binary' } }, 'image/jpeg': { schema: { type: 'string', format: 'binary' } }, 'image/png': { schema: { type: 'string', format: 'binary' } } } } }),
      delete: op('Imágenes', 'Quitar la imagen', { security: conSesion }),
    },
  },
};
