import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { fileURLToPath } from "url";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();

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
const server = registerRoutes(app);

// Initialize server before setting up Vite
const EXPRESS_PORT = 3000;
const EXPRESS_HOST = '0.0.0.0';

const startServer = async () => {
  try {
    // Handle static files and SPA routing based on environment
    if (process.env.NODE_ENV === 'production') {
      // Serve static files in production
      serveStatic(app);
    } else {
      // Setup Vite middleware for development
      await setupVite(app, server);
    }

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      res.status(500).json({
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message
      });
    });

    server.listen(EXPRESS_PORT, EXPRESS_HOST, () => {
      log(`Express server running on http://${EXPRESS_HOST}:${EXPRESS_PORT} (${process.env.NODE_ENV || 'development'} mode)`, 'express');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
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