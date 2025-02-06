import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: "*.replit.dev",
    },
    fs: {
      strict: true,
      allow: [path.resolve(__dirname, "src"), path.resolve(__dirname, "../shared")]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    cors: true,
    allowedHosts: [
      "localhost",
      "0.0.0.0",
      "*.replit.dev",
      "b196dfc5-9c58-4e32-b69d-a8830ce942e6-00-3ufe03eyryib8.spock.replit.dev"
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared")
    }
  }
});