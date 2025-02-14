import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { setupAuth } from "./auth";
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import fs from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  details?: any;
}

// Explicitly set development mode if not in production
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

const app = express();

// Health check endpoint - place it before other middleware to ensure quick response
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add strict no-cache headers to all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Enhanced CORS configuration - MUST come before session middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log(`Setting CORS for origin: ${origin}`);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Session configuration with detailed logging
const sessionSettings: session.SessionOptions = {
  secret: process.env.REPL_ID!,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'connect.sid' // Being explicit about the cookie name
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
  console.log("Production mode: trusting proxy");
}

// Session and auth middleware
app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Request started`);

  if (req.isAuthenticated()) {
    console.log('User is authenticated:', req.user);
  } else {
    console.log('Unauthenticated user info request');
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Set up authentication
setupAuth(app);

// Register routes
const server = registerRoutes(app);

// Add detailed static file request logging
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    console.log('Static file request:', {
      path: req.path,
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// API-specific error handling middleware
app.use('/api', (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(status).json({
    message,
    stack,
    details: err.details || undefined
  });
});

// Handle static files and client routing
if (process.env.NODE_ENV === "development") {
  console.log('[DEV] Setting up Vite development server');
  setupVite(app).catch(err => {
    console.error('Vite setup error:', err);
    process.exit(1);
  });
} else {
  // Serve static files with detailed logging and no caching
  const distPath = path.resolve(__dirname, '../dist/public');
  console.log('Serving static files from:', distPath);

  // Serve static files from the client build directory
  app.use(express.static(distPath, {
    index: false,
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));


  // Handle all other routes by serving index.html
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Generic error handling middleware
app.use((err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Enhanced server startup with health check verification
function startServer(port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    let serverReady = false;

    const healthCheck = async () => {
      try {
        const response = await fetch(`http://0.0.0.0:${port}/health`);
        if (response.ok) {
          console.log(`[${new Date().toISOString()}] Health check passed - server is ready`);
          serverReady = true;
          resolve(server);
        } else {
          throw new Error('Health check failed');
        }
      } catch (err) {
        if (!serverReady) {
          console.log(`[${new Date().toISOString()}] Waiting for server to be ready...`);
          setTimeout(healthCheck, 1000);
        }
      }
    };

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[${new Date().toISOString()}] Port ${port} is in use, trying ${port + 1}`);
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        console.error('Server error:', err);
        reject(err);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] Server starting up at http://0.0.0.0:${port}`);
      if (process.env.NODE_ENV === "development") {
        console.log('[DEV] Running in development mode');
      }
      healthCheck();
    });
  });
}

// Start the server with enhanced logging and health verification
const PORT = Number(process.env.PORT) || 5000;

startServer(PORT).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});