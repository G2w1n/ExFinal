// src/config/db.js
// Una sola conexión (pool) a la base de datos del grupo (Neon/PostgreSQL)
import pg from 'pg';
import 'dotenv/config';

// Las fechas TIMESTAMP (sin zona) se guardan en hora de Perú: se devuelven tal cual, como texto
pg.types.setTypeParser(1114, (valor) => valor);
// NUMERIC llega como texto: se convierte a número
pg.types.setTypeParser(1700, (valor) => Number(valor));

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en el archivo .env');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 5,
});

// Ejecuta varias consultas en una transacción: todo o nada
export async function enTransaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await trabajo(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}
