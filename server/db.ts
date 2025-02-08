import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = false;  // Changed to false to avoid SSL/TLS pipeline issues
neonConfig.pipelineConnect = false;  // Changed to false to avoid connection pipeline issues

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create connection pool with proper SSL configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: true
  }
});

// Create drizzle instance
export const db = drizzle(pool, { schema });

// Test the connection on startup and retry if needed
const connectWithRetry = async (retries = 5, delay = 2000) => {  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT NOW()'); // Test query
      console.log('Successfully connected to the database');
      client.release();
      return true;
    } catch (err) {
      console.error(`Failed to connect to the database (attempt ${i + 1}/${retries}):`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to the database after multiple attempts');
};

// Initialize connection with proper error handling
connectWithRetry().catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});

export default db;