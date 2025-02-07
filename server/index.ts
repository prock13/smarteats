import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { setupAuth } from "./auth";

const app = express();

// Ensure body parsing middleware is set up before routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;

  // Log request body for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    console.log(`${method} ${path} - Request Body:`, JSON.stringify(req.body, null, 2));
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`${method} ${path} - ${status} - ${duration}ms`);
  });

  next();
});

// CORS middleware to handle host validation
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Set up sessions first
const sessionSettings: session.SessionOptions = {
  secret: process.env.REPL_ID!,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

// Register API routes first
const server = registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Set up Vite or serve static files last
(async () => {
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    // Serve static files only for non-API routes
    app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        next();
      } else {
        serveStatic(app)(req, res, next);
      }
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();