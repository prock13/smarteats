import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;

// Production settings
process.env.NODE_ENV = 'production';
console.log('Running in production mode');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create connection pool with production configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: true
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Production-ready connection handling
const connectWithRetry = async (retries = 5, delay = 2000) => {  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (${i + 1}/${retries})...`);
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()'); // Test query
      console.log('Successfully connected to the database in production mode:', result.rows[0]);
      client.release();
      return true;
    } catch (err) {
      console.error(`Failed to connect to the database (attempt ${i + 1}/${retries}):`, err);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to the database after multiple attempts');
};

// Initialize connection with proper error handling
connectWithRetry().catch(err => {
  console.error('Fatal: Database connection failed:', err);
  process.exit(1);
});

// Set up error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // In production, crash and let the process manager restart
});

export default db;