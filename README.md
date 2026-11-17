# ✈️🚌 Viaje a Cusco · Grupo 15

**Compra tu pasaje y reserva el estacionamiento del aeropuerto en el mismo flujo.**

Trabajo final de Diseño Web (NRC 30239). Une dos apps en **un solo sistema**: una SPA en React, una API en Node + Express y **una sola base de datos** en Neon.

| App | Integrante | Tabla principal |
|---|---|---|
| **TransAndino Perú** (pasajes en bus) | Pérez Huamani, Julius Axl Nicolai | `compras_pasajes` |
| **Aeropuerto Internacional del Cusco** (estacionamiento) | Mueras Villanueva, Jefferson Percy | `reservas_estacionamiento` |

> Caso académico ficticio: los pagos son simulados.

## Cómo está armado

```
React (Vercel)  →  API Node + Express (Render)  →  PostgreSQL (Neon)
  pantallas          reglas y seguridad              los datos
```

```
ExFinal/
├── app_web_node_api/          API (Render)
│   ├── database/              schema.sql y init.js (tablas + datos de prueba)
│   ├── src/
│   │   ├── config/db.js       1 sola conexión a Neon
│   │   ├── routes/            auth · pasajes · reservas · integraciones · crm
│   │   ├── controllers/       reciben la petición y responden JSON
│   │   ├── services/          reglas de negocio (precio, estados, permisos)
│   │   ├── repositories/      solo SQL, siempre con parámetros ($1, $2…)
│   │   ├── middlewares/       auth (JWT), requireRol, errorHandler
│   │   └── utils/             tarifas, validaciones, códigos
│   └── test/                  pruebas de las tarifas (npm test)
├── app_web_react/             SPA (Vercel)
│   └── src/
│       ├── api/               client.js (axios + token) y servicios.api.js
│       ├── context/           AuthContext (sesión + roles) y avisos
│       ├── components/        Layout, menú por roles, RutaProtegida, pago, historial…
│       ├── modulos/
│       │   ├── transandino/   Comprar · Mis pasajes · Editar · Panel
│       │   └── aeropuerto/    Reservar · Mis reservas · Editar · Panel
│       ├── integraciones/     MisViajes · EspacioBuses · LlegadasEsperadas
│       ├── crm/               Clientes · Ficha del cliente · Indicadores
│       └── pages/             Inicio (portada), Login, Registro
└── render.yaml                configuración de Render
```

## Lo que hace

**Común (HU-0):** un solo inicio de sesión. El menú muestra solo las apps y opciones de los roles de cada usuario (tabla `usuario_rol`). Cada ruta valida el rol en el frontend **y** en la API.

**Cada módulo migrado (Registro · Consulta · Actualizar · Panel CRUD)**

| | TransAndino | Aeropuerto |
|---|---|---|
| Registro | Comprar pasaje con mapa de 40 asientos (1–12 cama, 13–40 semicama) | Reservar estacionamiento |
| Consulta | Mis pasajes, con seguimiento de estados | Mis reservas, con seguimiento |
| Actualizar | Editar antes de pagar (se recalcula el precio) | Editar antes de pagar |
| Panel | Cobrar, embarcar, cancelar, eliminar, venta presencial | Cobrar, preparar espacio, asignar zona, salida, cancelar, eliminar |

**Las 3 integraciones**

| Funcionalidad | HU / RF | Dónde |
|---|---|---|
| 1. Pasaje + estacionamiento | HU-15.1 · HU-15.4 · RF-15.1 · RF-15.4 | Tras comprar el pasaje, «Reservar estacionamiento» abre el aeropuerto con la fecha y la hora ya llenas (llegada + 30 min) y guarda `id_pasaje`. «Mis viajes» muestra los dos juntos con un JOIN. |
| 2. Espacio para buses | HU-15.2 · RF-15.2 | El admin de TransAndino (cliente del aeropuerto) reserva espacio con `tipo = 'bus'`. El empleado del aeropuerto asigna la zona y TransAndino la ve. |
| 3. Llegadas esperadas | HU-15.3 · RF-15.3 | El empleado ve las reservas unidas a los pasajes, ordenadas por `hora_llegada` del bus, y prepara los espacios. |

**CRM (trazabilidad, como en la guía de Delicia)**
- La tabla `estados_historial` guarda **cada cambio de estado, quién lo hizo y cuándo**.
- La **ficha del cliente** junta sus pasajes, reservas, pagos, línea de tiempo y notas de seguimiento.
- **Tipos de cliente:** frecuente (3 o más viajes), nuevo, regular o inactivo (sin compras en 90 días).
- **Indicadores** de las dos apps juntas.
- "Mis viajes", las llegadas y los paneles **se actualizan solos**, sin recargar la página.

**Reglas en el servidor**
- El precio se calcula en la API; el total que envía el navegador se ignora.
- Los estados van en orden: saltar un paso responde **409**.
- Sin token responde **401**; sin el rol, **403**, aunque llamen a la API directo.
- Los pagos y los cambios de estado van en **transacciones** (`BEGIN … COMMIT`, con `FOR UPDATE`).
- Un asiento no se vende dos veces (índice único).
- Las contraseñas se guardan cifradas con **bcrypt**.

## Cuentas de prueba (contraseña `123456`)

| Correo | Roles |
|---|---|
| `cliente1@correo.com` … `cliente10@correo.com` | cliente en TransAndino y en el Aeropuerto |
| `admin@transandino.pe` | administrador de TransAndino · cliente del Aeropuerto |
| `empleado1@transandino.pe` | empleado de TransAndino |
| `admin@aeropuerto.pe` | administrador del Aeropuerto · cliente de TransAndino |
| `empleado1@aeropuerto.pe` | empleado del Aeropuerto |

Los datos de prueba se crean **relativos a la fecha de hoy**: siempre hay buses que llegan hoy a Cusco con reserva de estacionamiento.

## Paso 1 · Base de datos en Neon

1. En [console.neon.tech](https://console.neon.tech) crea un proyecto nuevo, por ejemplo `grupo15`.
2. En *Dashboard → Connect* copia la **cadena de conexión** (empieza con `postgresql://`).
3. En tu PC, dentro de `app_web_node_api`, copia `.env.example` como `.env` y pega la cadena en `DATABASE_URL`.
4. Crea las tablas y los datos de prueba:
   ```bash
   cd app_web_node_api
   npm install
   npm run db:init
   ```
   ⚠️ `db:init` **borra y vuelve a crear** las tablas del proyecto. Úsalo para empezar o para dejar los datos de prueba como nuevos.

> El archivo `.env` **nunca** se sube a GitHub (está en `.gitignore`).

## Paso 2 · Probar en tu PC

```bash
# Terminal 1: API
cd app_web_node_api
npm run dev            # http://localhost:3000/api/salud → { "ok": true }

# Terminal 2: React
cd app_web_react
npm install
npm run dev            # http://localhost:5173
```

Pruebas de las reglas de precio: `cd app_web_node_api && npm test`.

## Paso 3 · Publicar la API en Render

1. En [render.com](https://render.com): *New → Blueprint* y elige este repositorio (lee `render.yaml`).
   También puedes hacerlo a mano: *New → Web Service*, carpeta raíz `app_web_node_api`, build `npm install`, start `npm start`.
2. Variables de entorno:
   - `DATABASE_URL` = la cadena de Neon
   - `DB_SSL` = `true`
   - `JWT_SECRET` = una frase larga (el blueprint la genera sola)
   - `CORS_ORIGIN` = el link de Vercel del paso 4. Con `*` acepta también las vistas previas de Vercel, por ejemplo `https://exfinal*.vercel.app` (varios links se separan con coma)
3. Al terminar, abre `https://TU-API.onrender.com/api/salud`.

> En el plan gratis, Render **se duerme** después de 15 minutos sin uso, y la primera petición tarda cerca de 50 s. Antes de la exposición, abre la página unos minutos antes.

## Paso 4 · Publicar el React en Vercel

1. En [vercel.com](https://vercel.com): *Add New → Project*, este repositorio, **Root Directory** `app_web_react` (Vite se detecta solo).
2. Variable de entorno: `VITE_API_URL` = `https://TU-API.onrender.com/api`. Vite la guarda **al construir**: si la cambias, usa *Redeploy*. Si falta, la página publicada usa la API de Render del grupo (`exfinal-hd5z.onrender.com`).
3. *Deploy*. Después vuelve a Render y pon ese link en `CORS_ORIGIN`.

`vercel.json` hace que las rutas de React (por ejemplo `/app/mis-viajes`) funcionen al recargar.

## API (resumen)

| Método y ruta | Quién |
|---|---|
| `POST /api/auth/login` · `POST /api/auth/registro` · `GET /api/auth/yo` | todos |
| `GET /api/pasajes/rutas` · `GET /api/pasajes/asientos` · `POST /api/pasajes/cotizar` | público |
| `POST /api/pasajes` · `GET /api/pasajes/mios` · `PUT /api/pasajes/:id` · `POST /api/pasajes/:id/pagar` · `/cancelar` · `GET /:id/historial` | dueño o personal TA |
| `GET /api/pasajes` · `PATCH /api/pasajes/:id/estado` · `DELETE /api/pasajes/:id` | personal TA (eliminar: admin) |
| `POST /api/reservas` · `GET /api/reservas/mias` · `PUT /api/reservas/:id` · `POST /:id/pagar` · `/cancelar` | dueño o personal Aeropuerto |
| `GET /api/reservas` · `PATCH /:id/estado` · `PATCH /:id/zona` · `DELETE /:id` | personal Aeropuerto (eliminar: admin) |
| `GET /api/integraciones/mis-viajes` · `GET /prellenado/:idPasaje` | cliente |
| `POST /api/integraciones/espacio-bus` · `GET /mis-buses` | admin TransAndino |
| `GET /api/integraciones/llegadas?fecha=` | personal Aeropuerto |
| `GET /api/crm/clientes` · `GET /api/crm/clientes/:id` · `POST /:id/notas` · `GET /api/crm/indicadores` | personal de cualquiera de las dos apps |

Todas las respuestas de error tienen la forma `{ "mensaje": "…" }`.

## Modelo de datos

`usuarios` (1) — (N) `usuario_rol` (modulo, rol) · `rutas` (1) — (N) `compras_pasajes` (1) — (0..1) `reservas_estacionamiento` (por `id_pasaje`) · `pagos` y `estados_historial` para pasajes y reservas · `notas_cliente` para el CRM.

Las fechas de viaje y de ingreso se guardan en **hora de Perú** (`TIMESTAMP` sin zona); las fechas de registro, pagos e historial usan `TIMESTAMPTZ`.
