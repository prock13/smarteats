import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Initialize connection with proper error handling
const connectWithRetry = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Successfully connected to the database:', result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    throw err;
  }
};

// Initialize connection
connectWithRetry().catch(err => {
  console.error('Fatal: Database connection failed:', err);
  process.exit(1);
});

// Set up error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export default db;