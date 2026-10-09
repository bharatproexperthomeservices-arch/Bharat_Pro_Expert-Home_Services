import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // The browser receives only the public VITE_RAZORPAY_KEY_ID.
  // Never expose RAZORPAY_KEY_SECRET in this file or frontend bundles.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': rootDir },
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    // Local Express API; Vercel uses the /api/*.js serverless functions in production.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
});
