import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: '*.replit.dev'
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  css: {
    devSourcemap: true,
    postcss: {
      plugins: ['tailwindcss', 'autoprefixer']
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles.css';
          }
          return 'assets/[name].[hash].[ext]';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
});