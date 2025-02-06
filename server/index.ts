import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

// Enhanced error logging
const logError = (err: Error) => {
  console.error('Detailed error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
};

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.url}`, 'express');

  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, 'express');
  });

  next();
});

// Register API routes first
let server;
try {
  log('Registering routes...', 'express');
  server = registerRoutes(app);
  log('Routes registered successfully', 'express');
} catch (err) {
  logError(err as Error);
  process.exit(1);
}

// Let Express use the default port (3000) or the one from environment
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

const startServer = async () => {
  try {
    log('Starting server initialization...', 'express');

    // Handle static files and SPA routing based on environment
    if (process.env.NODE_ENV === 'production') {
      log('Setting up production static serving...', 'express');
      serveStatic(app);
    } else {
      log('Setting up development Vite middleware...', 'express');
      await setupVite(app, server);
    }

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logError(err);
      res.status(500).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message
      });
    });

    server.listen(port, host, () => {
      log(`Express server running on http://${host}:${port} (${process.env.NODE_ENV || 'development'} mode)`, 'express');
    });
  } catch (err) {
    logError(err as Error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handler
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });

  // Force exit if graceful shutdown fails
  setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);