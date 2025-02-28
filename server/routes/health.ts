
import { Express, Request, Response } from "express";

export function registerHealthRoutes(app: Express) {
  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });
}
