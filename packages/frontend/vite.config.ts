import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { cspReplace } from './vite-plugins/csp-replace';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const plugins = [
    react({
      jsxRuntime: 'automatic',
    }),
    cspReplace(),
  ];

  // Add bundle analyzer only in analyze mode
  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  return {
    plugins,
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    base: './', // Use relative paths for Tauri
    cssCodeSplit: false, // Ensure CSS is not split to prevent loading issues
    commonjsOptions: {
      include: [/node_modules/, /shared/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
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
  };
});