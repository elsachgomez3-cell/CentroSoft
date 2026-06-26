import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Pool de conexiones a PostgreSQL.
// Lee las credenciales desde el archivo .env
// nunca hardcodeadas en el código.
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'centrosoft',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Neon (y la mayoría de proveedores en la nube) exigen SSL.
  // En local normalmente no se usa, así que se activa solo si
  // DB_SSL=true está definido en el .env / variables de entorno.
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
});

// Función que verifica la conexión al iniciar el servidor.
// Si falla, el servidor no debe arrancar.
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() AS hora_actual');
    console.log(`✅ Base de datos conectada — ${result.rows[0].hora_actual}`);
    client.release();
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    // Detiene el proceso si no hay conexión a la BD.
    // Es mejor fallar rápido que correr con errores silenciosos.
    process.exit(1);
  }
};

export default pool;