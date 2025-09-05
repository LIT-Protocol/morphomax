import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  const sentryEnabled =
    isBuild &&
    ((process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') ||
      String(process.env.SENTRY_UPLOAD_SOURCEMAPS).toLowerCase() === 'true');

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(sentryEnabled
        ? [
            sentryVitePlugin({
              applicationKey: 'vincent-yield-frontend',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: 'lit-protocol-lw',
              project: 'vincent-yield-frontend',
            }),
          ]
        : []),
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
  };
});
