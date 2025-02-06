import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Initialize express app
const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS and proper host handling
app.use((req, res, next) => {
  const allowedHosts = [
    "localhost",
    "0.0.0.0",
    "*.replit.dev",
    "b196dfc5-9c58-4e32-b69d-a8830ce942e6-00-3ufe03eyryib8.spock.replit.dev"
  ];

  const host = req.get('host');
  if (host && (
    allowedHosts.includes(host) ||
    host.endsWith('.replit.dev') ||
    host === 'localhost:5000' ||
    host === '0.0.0.0:5000'
  )) {
    // Allow the Replit host
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  } else {
    res.status(403).json({ error: 'Host not allowed' });
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  // Capture JSON responses for logging
  let capturedResponse: any;
  const originalJson = res.json;
  res.json = function(body) {
    capturedResponse = body;
    return originalJson.call(this, body);
  };

  // Log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logMessage = `${req.method} ${path} ${res.statusCode} ${duration}ms`;
      if (capturedResponse) {
        const responseStr = JSON.stringify(capturedResponse);
        logMessage += ` Response: ${responseStr.substring(0, 100)}${responseStr.length > 100 ? '...' : ''}`;
      }
      log(logMessage);
    }
  });

  next();
});

// Main application bootstrap
(async () => {
  try {
    // Register API routes first
    const server = registerRoutes(app);

    // Set up Vite or static serving based on environment
    if (process.env.NODE_ENV !== "production") {
      log("Setting up Vite development server...");
      await setupVite(app, server);
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
    }

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      res.status(500).json({
        message: process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message
      });
    });

    // Start server
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`Server running on port ${port} (${process.env.NODE_ENV || "development"} mode)`);
    });

    // Graceful shutdown handler
    const shutdown = () => {
      log("Shutting down gracefully...");
      server.close(() => {
        log("Server closed");
        process.exit(0);
      });

      // Force exit if graceful shutdown fails
      setTimeout(() => {
        log("Forcing shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();