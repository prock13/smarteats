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
import compression from 'compression';
import helmet from 'helmet';

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

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Production-specific optimizations
if (process.env.NODE_ENV === "production") {
  // Enable compression for all responses
  app.use(compression());

  // Set security headers
  app.use(helmet());

  // Cache static assets
  app.use(express.static('dist/public', {
    maxAge: '1d',
    etag: true,
    lastModified: true
  }));
} else {
  // Development-specific middleware
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Health check endpoint - place it before other middleware
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Add strict no-cache headers to API responses only
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Allow static assets to be cached
app.use('/uploads', express.static('uploads', {
  maxAge: '1h',
  etag: true
}));

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

// Development mode setup with Vite
if (process.env.NODE_ENV === "development") {
  setupVite(app).then(vite => {
    if (!vite) {
      console.error('Failed to initialize Vite middleware');
      process.exit(1);
    }

    // Use Vite's middlewares before auth but after session
    app.use(vite.middlewares);

    // Set up authentication after Vite middleware
    setupAuth(app);

    // Register routes after auth
    registerRoutes(app);

    // SPA route handler - make sure this comes after Vite middleware
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes and static files
      if (url.startsWith('/api/') || url.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/)) {
        return next();
      }

      // Check if the request is for a public route
      const publicPaths = ['/auth', '/login', '/register', '/', '/terms', '/about'];
      const isPublicPath = publicPaths.some(path => url === path);

      try {
        const template = await fs.promises.readFile('client/index.html', 'utf-8');
        const transformed = await vite.transformIndexHtml(url, template);

        // Only redirect to auth for protected paths when not authenticated
        // Only check authentication for API routes and protected paths
        if (url.startsWith('/api/')) {
          if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
          }
          return next();
        }

        // For non-API routes, only redirect specific protected paths
        // Handle API routes first
        if (url.startsWith('/api/')) {
          if (!req.isAuthenticated()) {
            return res.status(401).json({ message: "Not authenticated" });
          }
          return next();
        }

        // Define protected and public paths
        const protectedPaths = ['/planner', '/calendar', '/recipes', '/favorites', '/profile', '/preferences', '/pantry', '/myfitnesspal'];
        const publicPaths = ['/', '/auth', '/login', '/register', '/about', '/terms'];
        
        const isProtectedPath = protectedPaths.some(path => url.startsWith(path));
        const isPublicPath = publicPaths.some(path => url === path); // Exact match for public paths

        if (isProtectedPath && !req.isAuthenticated()) {
          return res.redirect('/auth');
        }

        // Serve the app for all routes
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);

        res.status(200).set({ 'Content-Type': 'text/html' }).end(transformed);
      } catch (e) {
        if (vite) {
          vite.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
  }).catch(err => {
    console.error('Vite setup error:', err);
    process.exit(1);
  });
} else {
  // Production static file serving with caching
  app.use(express.static(path.join(__dirname, '../dist/client'), {
    index: false,
    maxAge: '1h',
    etag: true
  }));

  // Set up authentication
  setupAuth(app);

  // Register routes
  registerRoutes(app);

  // SPA route handler for production
  app.get('*', (req, res) => {
    const url = req.originalUrl;
    const publicPaths = ['/auth', '/login', '/register'];
    const isPublicPath = publicPaths.some(path => url.startsWith(path));

    if (!isPublicPath && !req.isAuthenticated()) {
      return res.redirect('/auth');
    }

    const indexPath = path.join(__dirname, '../dist/client/index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(500).json({ 
        message: `Could not find index.html at ${indexPath}. Please ensure the client has been built.` 
      });
    }

    res.sendFile(indexPath);
  });
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

// Start the server
const PORT = Number(process.env.PORT) || 3000;
const server = createServer(app);

// Add error handling for the server
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server starting up at http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}).on('error', (error: NodeJS.ErrnoException) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

export default app;