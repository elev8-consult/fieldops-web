import { defineConfig } from 'vite';
import react            from '@vitejs/plugin-react';
import tailwindcss      from '@tailwindcss/vite';
import path             from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target:
          process.env.VITE_PROXY_TARGET ??
          'http://localhost:3000',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  build: {
    outDir:    'dist',
    sourcemap: false,
  },
});
