import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: "*.replit.dev",
    },
    fs: {
      strict: false,
      allow: [".."],
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    watch: {
      usePolling: true,
    },
    origin:
      "https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co",
    // Add this new configuration
    allowedHosts: [
      "localhost",
      "*.replit.dev",
      "*.repl.co",
      ".spock.replit.dev",
      "b196dfc5-9c58-4e32-b69d-a8830ce942e6-00-3ufe03eyryib8.spock.replit.dev",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
  },
});
