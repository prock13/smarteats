import { type Request, type Response, type NextFunction } from "express";

export const log = (message: string) => {
  console.log(`[Server] ${message}`);
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Add server status logging
export const logServerStart = (port: number | string) => {
  log(`Server is starting...`);
  log(`Server will be accessible on port ${port}`);
  log(`Development server (Vite) will be accessible on port 5173`);
};