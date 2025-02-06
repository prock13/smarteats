import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite, serveStatic, log } from "./vite";
import { Server as HttpServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer(): Promise<HttpServer> {
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

  let server: HttpServer;
  try {
    // Register routes and create HTTP server
    log('Registering routes...', 'express');
    server = registerRoutes(app);
    log('Routes registered successfully', 'express');

    // Set up development middleware
    if (process.env.NODE_ENV !== 'production') {
      log('Setting up development Vite middleware...', 'express');
      await setupVite(app, server);
      log('Vite middleware setup completed', 'express');
    } else {
      log('Setting up production static serving...', 'express');
      serveStatic(app);
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

    // Start server
    const port = Number(process.env.PORT) || 5000;
    const host = '0.0.0.0';

    return new Promise((resolve, reject) => {
      server.listen(port, host, () => {
        log(`Express server running on http://${host}:${port} (${process.env.NODE_ENV || 'development'} mode)`, 'express');
        resolve(server);
      }).on('error', (error: NodeJS.ErrnoException) => {
        logError(error);
        reject(error);
      });
    });
  } catch (error) {
    logError(error as Error);
    throw error;
  }
}

// Start the server with better error handling
createServer().catch((error: Error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});