import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
// import viteConfig from "../vite.config"; // Removed as it's not used in the new setupVite
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

import {createServer} from 'vite';
import express from 'express';

export const setupVite = async (app: express.Application, isDev = process.env.NODE_ENV !== 'production') => {
  if (isDev) {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist', 'public'))); // Adjusted path for production build
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'public', 'index.html')); // Adjusted path for production build
    });
  }
};


// Removed serveStatic function as it's now handled in setupVite