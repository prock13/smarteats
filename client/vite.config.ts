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
    host: process.env.VITE_HOST || '0.0.0.0',
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '5000'),
    strictPort: true,
    hmr: {
      clientPort: parseInt(process.env.VITE_DEV_SERVER_HMR_CLIENT_PORT || '443'),
      host: process.env.VITE_DEV_SERVER_HMR_HOST,
      protocol: 'wss',
    },
    proxy: {
      "/api": {
        target: `http://${process.env.VITE_HOST || '0.0.0.0'}:3000`,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url, '=>', proxyReq.path);
          });
        }
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