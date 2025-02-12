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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  details?: any;
}

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Set up sessions first
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
  }
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(session(sessionSettings));

// Initialize passport after session
app.use(passport.initialize());
app.use(passport.session());

// Set up authentication
setupAuth(app);

// Create HTTP server and register routes first
const server = registerRoutes(app);

// Add detailed request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${req.method} ${req.path} - Request started`);

  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }

  // Log request headers in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Request Headers:', req.headers);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// CORS middleware with detailed logging
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
  setupVite(app).catch(err => {
    console.error('Vite setup error:', err);
    process.exit(1);
  });
} else {
  // Serve static files with detailed logging
  const distPath = path.resolve(__dirname, '../dist/public');
  console.log('Serving static files from:', distPath);

  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      res.set('X-Content-Type-Options', 'nosniff');
      if (path.endsWith('.js')) {
        res.set('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.set('Content-Type', 'text/css');
      }
    }
  }));

  // Handle client-side routing
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      const indexPath = path.join(distPath, 'index.html');
      console.log('Serving index.html from:', indexPath);
      res.sendFile(indexPath);
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

const PORT = Number(process.env.PORT) || 5000;

// Find an available port
function startServer(port: number) {
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is in use, trying ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);