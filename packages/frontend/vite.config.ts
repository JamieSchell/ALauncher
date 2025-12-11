import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { cspReplace } from './vite-plugins/csp-replace';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    cspReplace(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  optimizeDeps: {
    include: ['@modern-launcher/shared', 'gifuct-js', '@tauri-apps/api'],
    esbuildOptions: {
      target: 'es2020',
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    base: './', // Use relative paths for Tauri
    cssCodeSplit: false, // Ensure CSS is not split to prevent loading issues
    commonjsOptions: {
      include: [/node_modules/, /shared/],
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB to suppress warnings
    rollupOptions: {
      external: ['@tauri-apps/api', '@tauri-apps/plugin-process'],
      output: {
        manualChunks: (id) => {
          // Split vendor chunks for better code splitting
          if (id.includes('node_modules')) {
            // React core libraries - ensure single instance
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
              return 'react-core';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'react-router';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            // Framer Motion
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // Axios
            if (id.includes('axios')) {
              return 'axios';
            }
            // Zustand
            if (id.includes('zustand')) {
              return 'zustand';
            }
            // Lucide icons
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
            // Tauri
            if (id.includes('@tauri-apps')) {
              return 'tauri';
            }
            // Large utility libraries
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts';
            }
            // Split remaining vendor into smaller chunks by first letter
            if (id.includes('node_modules')) {
              const match = id.match(/node_modules\/(@?[^/]+)/);
              if (match) {
                const packageName = match[1];
                // Group scoped packages together
                if (packageName.startsWith('@')) {
                  return 'vendor-scoped';
                }
                // Split by first letter to create smaller chunks
                const firstLetter = packageName.charAt(0).toLowerCase();
                if (firstLetter >= 'a' && firstLetter <= 'f') {
                  return 'vendor-a-f';
                } else if (firstLetter >= 'g' && firstLetter <= 'm') {
                  return 'vendor-g-m';
                } else if (firstLetter >= 'n' && firstLetter <= 's') {
                  return 'vendor-n-s';
                } else {
                  return 'vendor-t-z';
                }
              }
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all interfaces to allow access via IP
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  // Tauri expects a Vite dev server output by default
  clearScreen: false,
});