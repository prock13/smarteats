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
    host: true,
    hmr: {
      clientPort: 443
    },
    allowedHosts: [
      '.replit.dev',
      'b196dfc5-9c58-4e32-b69d-a8830ce942e6-00-3ufe03eyryib8.spock.replit.dev',
      'localhost',
      '0.0.0.0'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});