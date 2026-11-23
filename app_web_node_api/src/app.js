// src/app.js
// Arma la aplicación Express: seguridad básica, CORS, JSON y rutas
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import pasajesRoutes from './routes/pasajes.routes.js';
import reservasRoutes from './routes/reservas.routes.js';
import integracionesRoutes from './routes/integraciones.routes.js';
import crmRoutes, { notificacionesRoutes } from './routes/crm.routes.js';
import cajaRoutes from './routes/caja.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { pool } from './config/db.js';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './docs/openapi.js';

export const app = express();

// CORS_ORIGIN: links del frontend separados por coma. Acepta * en el nombre del sitio,
// por ejemplo https://exfinal*.vercel.app (producción y vistas previas de Vercel)
const origenes = String(process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',').map((o) => o.trim().replace(/\/+$/, '')).filter(Boolean)
  .map((o) => new RegExp(`^${o.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[a-z0-9-]*')}$`, 'i'));
export const origenPermitido = (origen) => !origen || origenes.some((r) => r.test(origen));
app.use(cors({ origin: (origen, listo) => listo(null, origenPermitido(origen)) }));
app.use(express.json({ limit: '100kb' }));
app.disable('x-powered-by');

app.get('/api/salud', async (_req, res) => {
  const [fila] = (await pool.query('SELECT NOW() AS ahora')).rows;
  res.json({ ok: true, base: fila ? 'conectada' : 'sin respuesta' });
});

// Documentación interactiva de la API (Swagger)
app.get('/api/docs.json', (_req, res) => res.json(openapi));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'API Grupo 15 · Viaje a Cusco', swaggerOptions: { persistAuthorization: true } }));

app.use('/api/auth', authRoutes);
app.use('/api/pasajes', pasajesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/integraciones', integracionesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/caja', cajaRoutes);

app.use('/api', (_req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
app.use(errorHandler);
