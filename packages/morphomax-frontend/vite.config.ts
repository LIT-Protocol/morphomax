import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      org: 'lit-protocol-lw',
      project: 'vincent-yield-frontend',
    }),
    sentryVitePlugin({
      org: 'lit-protocol-lw',
      project: 'vincent-yield-frontend',
    }),
  ],

  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@lit-protocol/vincent-app-sdk/jwt', '@lit-protocol/vincent-app-sdk/webAuthClient'], // Dev: delete node_modules/.vite when rebuilding this
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
    },
  },
  build: {
    sourcemap: true,
  },
});
