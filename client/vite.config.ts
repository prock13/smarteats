import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }), 
    runtimeErrorOverlay(), 
    themePlugin()
  ],
  server: {
    host: '0.0.0.0',
    port: 8000,
    strictPort: true,
    hmr: {
      clientPort: process.env.VITE_DEV_SERVER_HMR_CLIENT_PORT ? parseInt(process.env.VITE_DEV_SERVER_HMR_CLIENT_PORT) : 443,
      host: process.env.VITE_DEV_SERVER_HMR_HOST,
      protocol: 'wss',
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});