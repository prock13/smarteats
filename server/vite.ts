
import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
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

export const setupVite = async (
  app: express.Application,
  config = {},
  isDev = process.env.NODE_ENV !== "production"
) => {
  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          protocol: 'ws',
          port: 24678,
          clientPort: 443
        },
        host: true,
        strictPort: true,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: "custom",
      base: '/',
      ...config
    });

    app.use(vite.middlewares);
    return vite;
  } else {
    app.use(express.static(path.resolve(__dirname, "dist", "public")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "public", "index.html"));
    });
    return null;
  }
};
