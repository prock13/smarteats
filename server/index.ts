import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite } from "./vite";
import { log, logServerStart } from "./utils";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { setupAuth } from "./auth";

const app = express();
const PORT = process.env.PORT || 5000;

// Log server startup
logServerStart(PORT);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// CORS middleware - only applied in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`${req.method} ${req.path} - Request started`);

  if (req.method === 'POST' || req.method === 'PUT') {
    log('Request Body: ' + JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });

  next();
});

// Create HTTP server and register routes
const server = registerRoutes(app);

// API-specific error handling middleware
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Handle static files and client routing
if (process.env.NODE_ENV === "development") {
  // Setup Vite middleware for development
  setupVite(app)
    .then(() => {
      log('Vite middleware setup complete');
      // Start the server after Vite is ready
      server.listen(Number(PORT), "0.0.0.0", () => {
        log(`Server running on port ${PORT}`);
        log(`Development server ready on port 5173`);
      });
    })
    .catch(err => {
      console.error('Vite setup error:', err);
      process.exit(1);
    });
} else {
  // Serve static files from the dist/public directory
  app.use(express.static('dist/public'));

  // Handle client-side routing by serving index.html for non-API routes
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile('index.html', { root: 'dist/public' });
    } else {
      next();
    }
  });

  // Start production server
  server.listen(Number(PORT), "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
}

// Generic error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});