import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
            format: 'cjs', // Main process should be CommonJS too
          },
        },
      },
      {
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
            format: 'cjs', // Preload must be CommonJS
          },
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@modern-launcher/shared', 'gifuct-js'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    base: './', // Use relative paths for Electron
    commonjsOptions: {
      include: [/node_modules/, /shared/],
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
  },
});
