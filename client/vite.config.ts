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
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
      host: process.env.REPL_SLUG ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : "0.0.0.0",
      timeout: 30000,
      overlay: false
    },
    fs: {
      strict: false,
      allow: [".."]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  css: {
    postcss: "./postcss.config.js",
    devSourcemap: true
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    minify: process.env.NODE_ENV === 'production',
    watch: null
  },
  optimizeDeps: {
    force: true,
    entries: [
      'src/**/*.{ts,tsx}',
      'src/main.tsx'
    ],
    include: ['**/*.css', '@/components/**/*', '@shared/**/*']
  },
  base: "./"
});