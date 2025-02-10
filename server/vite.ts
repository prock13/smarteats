import express from "express";
import { createServer } from "vite";
import { log } from "./utils";

export const setupVite = async (
  app: express.Application,
  isDev = process.env.NODE_ENV !== "production",
) => {
  if (isDev) {
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: 5173,
          host: "0.0.0.0",
        },
      },
      appType: "custom",
    });

    app.use(vite.middlewares);
    log("Vite middleware setup complete");
  } else {
    app.use(express.static("dist/public"));
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist/public" });
    });
  }
};
