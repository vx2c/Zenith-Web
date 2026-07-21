import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// PORT and BASE_PATH are provided by Replit's artifact system.
// Outside Replit (Vercel, local dev) they fall back to safe defaults.
const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || '/';

// Replit-specific plugins are loaded only when running inside Replit.
const isReplit =
  process.env.NODE_ENV !== 'production' &&
  process.env.REPL_ID !== undefined;

const replitPlugins = isReplit
  ? await Promise.all([
      import('@replit/vite-plugin-runtime-error-modal').then((m) => m.default()),
      import('@replit/vite-plugin-cartographer').then((m) =>
        m.cartographer({ root: path.resolve(import.meta.dirname, '..') }),
      ),
      import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
    ])
  : [];

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss(), ...replitPlugins],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
