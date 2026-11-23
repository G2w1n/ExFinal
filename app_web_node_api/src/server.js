// src/server.js
import 'dotenv/config';
import { createServer } from 'node:http';
import { app, origenPermitido } from './app.js';
import { iniciarTiempoReal } from './config/tiempoReal.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

// Express y Socket.IO comparten el mismo puerto (Render solo expone uno)
const servidor = createServer(app);
iniciarTiempoReal(servidor, origenPermitido);

const puerto = Number(process.env.PORT) || 3000;
servidor.listen(puerto, () => console.log(`API lista en http://localhost:${puerto}/api · documentación en /api/docs`));
