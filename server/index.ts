import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Initialize express app
const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    // Register API routes and get HTTP server instance
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      res.status(500).json({
        message: process.env.NODE_ENV === "production" 
          ? "Internal server error" 
          : err.message
      });
    });

    // Set up development or production mode
    if (process.env.NODE_ENV !== "production") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const port = 5000; // Explicitly set port to 5000
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