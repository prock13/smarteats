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

// Enhanced CORS configuration - MUST come before session middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Add strict no-cache headers to all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Session configuration
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
  name: 'connect.sid'
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Session and auth middleware
app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Development mode setup - Moving this before auth middleware
if (process.env.NODE_ENV === "development") {
  console.log('[DEV] Setting up Vite development server');
  setupVite(app).catch(err => {
    console.error('Vite setup error:', err);
    process.exit(1);
  });
}

// Production static file serving
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, '../dist/public');
  console.log('Serving static files from:', distPath);

  app.use(express.static(distPath, {
    index: false,
    etag: false,
    lastModified: false,
  }));
}

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const logPrefix = `[${new Date().toISOString()}]`;
  console.log(`${logPrefix} ${req.method} ${req.path} - Request started`);
  console.log(`${logPrefix} Headers:`, req.headers);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${logPrefix} ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Update the public routes middleware with better logging and matching
app.use((req, res, next) => {
  const publicPaths = [
    '/auth',
    '/login',
    '/register',
    '/api/login',
    '/api/register',
    '/api/auth/login',
    '/api/auth/register',
    '/assets',
    '/health',
    '/favicon.ico',
    '/@vite',
    '/@fs',
    '/@id',
    '/@react-refresh'
  ];

  const isDevelopment = process.env.NODE_ENV === 'development';
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
  const isDevServerRequest = req.path.match(/^\/@(vite|fs|id|react-refresh)/);
  const isOptionsRequest = req.method === 'OPTIONS';

  console.log(`[Auth Debug] Request details:
    Path: ${req.path}
    Method: ${req.method}
    Authenticated: ${req.isAuthenticated()}
    Is Development: ${isDevelopment}
    Is Public Path: ${isPublicPath}
    Is Options: ${isOptionsRequest}
  `);

  if (isOptionsRequest || isPublicPath || isDevServerRequest || (isDevelopment && req.path === '/')) {
    console.log(`[Auth Debug] Allowing access to: ${req.path}`);
    return next();
  }

  if (!req.isAuthenticated()) {
    console.log(`[Auth Debug] Authentication required for: ${req.path}`);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    return res.redirect('/auth');
  }

  next();
});

// Set up authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Serve index.html for client-side routing in development
if (process.env.NODE_ENV === "development") {
  const viteInstance = await setupVite(app, {
    hmr: {
      clientPort: 443,
      port: 24678,
      host: '0.0.0.0'
    }
  });
  
  app.use(async (req, res, next) => {
    try {
      // Always allow Vite-related and static assets
      if (req.path.includes('/@') || 
          req.path.includes('/.vite/') || 
          req.path.includes('/node_modules/') ||
          req.path.endsWith('.js') || 
          req.path.endsWith('.css') || 
          req.path.endsWith('.json') ||
          req.path.startsWith('/api/')) {
        return next();
      }

      // Allow access to auth page without authentication
      if (req.path === '/auth') {
        return viteInstance.middlewares(req, res, next);
      }

      // Redirect unauthenticated users to auth page
      if (!req.isAuthenticated()) {
        return res.redirect('/auth');
      }

      return viteInstance.middlewares(req, res, next);
    } catch (e) {
      next(e);
    }
  });
} else {
  // Production static file serving
  app.use(express.static('dist/client', {
    index: false
  }));
}


// Error handling middleware
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

// Start the server
const PORT = Number(process.env.PORT) || 3000;

startServer(PORT).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});