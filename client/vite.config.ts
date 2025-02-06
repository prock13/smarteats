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
      // Enable Fast Refresh for Replit
      fastRefresh: true,
      // Optimize for Replit's environment
      jsxRuntime: "automatic",
      babel: {
        // Add Replit-specific Babel plugins if needed
        plugins: [],
      }
    }), 
    runtimeErrorOverlay(), 
    themePlugin()
  ],
  server: {
    host: process.env.VITE_HOST,
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || "5000"),
    hmr: {
      clientPort: process.env.VITE_DEV_SERVER_HMR_CLIENT_PORT ? 
        parseInt(process.env.VITE_DEV_SERVER_HMR_CLIENT_PORT) : 443,
      host: process.env.VITE_DEV_SERVER_HMR_HOST
    },
    // Simple proxy configuration
    proxy: {
      "/api": "http://localhost:5000"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});