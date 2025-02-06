import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from 'fs';
import { type Server } from "http";
import { setupVite, serveStatic, log } from "./vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced CORS configuration for development
app.use((req, res, next) => {
  // Allow the Replit domain and any subdomain
  const allowedOrigins = ['http://localhost:5000'];
  const origin = req.headers.origin;

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.replit.dev'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Log requests
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// Register API routes first
const server = registerRoutes(app);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

// Use Vite middleware in development, static files in production
if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  setupVite(app, server).catch(err => {
    console.error("Failed to setup Vite middleware:", err);
    process.exit(1);
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Development server URL: http://localhost:${PORT}`);
});