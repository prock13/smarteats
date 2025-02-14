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

// Move static middleware and CORS to the very top
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    // Enhanced CORS configuration
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

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Set up authentication
setupAuth(app);

// Register routes
registerRoutes(app);

// Development mode setup with Vite
if (process.env.NODE_ENV === "development") {
  setupVite(app).then(vite => {
    if (!vite) {
      console.error('Failed to initialize Vite middleware');
      process.exit(1);
    }

    // Use Vite's middlewares after auth but before catch-all
    app.use(vite.middlewares);

    // SPA route handler - make sure this comes after Vite middleware
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;

      // Skip API routes and static files
      if (url.startsWith('/api/') || url.match(/\.(css|js|png|jpg|jpeg|gif|ico)$/)) {
        return next();
      }

      // Check if the request is for a public route
      const publicPaths = ['/auth', '/login', '/register'];
      const isPublicPath = publicPaths.some(path => url.startsWith(path));

      try {
        const template = await fs.promises.readFile('client/index.html', 'utf-8');
        const transformed = await vite.transformIndexHtml(url, template);

        // If not public and not authenticated, redirect to auth
        if (!isPublicPath && !req.isAuthenticated()) {
          return res.redirect('/auth');
        }

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
  // Production static file serving
  app.use(express.static('dist/client', {
    index: false,
    maxAge: '1h',
    etag: true
  }));

  // SPA route handler for production
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/client/index.html'));
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

// Enhanced server startup with port waiting
function startServer(port: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const server = createServer(app);
    let isReady = false;

    // Health check function to verify server is ready
    const checkHealth = async () => {
      try {
        if (!isReady) {
          const response = await fetch(`http://0.0.0.0:${port}/health`);
          if (response.ok) {
            console.log(`Server health check passed on port ${port}`);
            isReady = true;
            resolve(server);
          } else {
            setTimeout(checkHealth, 1000);
          }
        }
      } catch (err) {
        if (!isReady) {
          setTimeout(checkHealth, 1000);
        }
      }
    };

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, trying ${port + 1}`);
        startServer(port + 1).then(resolve).catch(reject);
      } else {
        console.error('Server error:', err);
        reject(err);
      }
    });

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server starting up at http://0.0.0.0:${port}`);
      checkHealth();
    });
  });
}

// Start the server
const PORT = Number(process.env.PORT) || 3000;
startServer(PORT).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});