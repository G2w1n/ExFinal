// src/server.js
import 'dotenv/config';
import { app } from './app.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const puerto = Number(process.env.PORT) || 3000;
app.listen(puerto, () => console.log(`API lista en http://localhost:${puerto}/api`));
