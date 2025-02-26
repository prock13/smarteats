import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: /\.(mdx|js|jsx|ts|tsx|css)$/
    }),
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  optimizeDeps: {
    force: false,
    exclude: ['@replit/vite-plugin-runtime-error-modal'],
    entries: ['src/**/*.{ts,tsx}'],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, "../dist/client"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      cache: true
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
});