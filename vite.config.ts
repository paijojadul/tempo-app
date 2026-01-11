import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react({
      // Remove babel config to use SWC instead (faster, no babel plugin needed)
      jsxRuntime: 'automatic',
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },

  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-state': ['zustand'],
          'vendor-utils': ['clsx', 'tailwind-merge'],
        },
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
  },

  preview: {
    port: 5173,
    host: true,
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },

  envPrefix: ['VITE_'],

  css: {
    devSourcemap: true,
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'clsx', 'tailwind-merge'],
  },
});