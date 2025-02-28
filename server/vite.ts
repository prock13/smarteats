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
        allowedHosts: true,
        host: "0.0.0.0",
        cors: true,
      },
      appType: "custom",
      optimizeDeps: {
        force: true,
      },
      plugins: [
        {
          name: 'vite-plugin-theme-json-override',
          enforce: 'pre',
          config() {
            return {
              plugins: [
                {
                  name: 'shadcn-theme-json-config',
                  config() {
                    return {
                      resolve: {
                        alias: {
                          './theme.json': path.resolve(__dirname, '../client/theme.json')
                        }
                      }
                    };
                  }
                }
              ]
            };
          },
          transformIndexHtml() {
            // Make sure theme.json is properly loaded
            const themeJsonPath = path.resolve(__dirname, '../client/theme.json');
            if (!fs.existsSync(themeJsonPath)) {
              viteLogger.warn(`Theme file not found at ${themeJsonPath}`);
            } else {
              viteLogger.info(`Using theme file from ${themeJsonPath}`);
            }
            return null;
          }
        }
      ],
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