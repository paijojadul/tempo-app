import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
  plugins: [
    react({
      // React 19+ optimizations
      babel: {
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]],
      },
    }),
  ],
  // ========== RESOLVE ALIAS ==========
  resolve: {
    alias: {
      // Main aliases (match with tsconfig.json)
      '@': path.resolve(__dirname, './src'),
      // Core aliases
      '@core': path.resolve(__dirname, './src/core'),
      '@/core': path.resolve(__dirname, './src/core'),
      '~/core': path.resolve(__dirname, './src/core'),
      // Modules aliases
      '@modules': path.resolve(__dirname, './src/modules'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '~/modules': path.resolve(__dirname, './src/modules'),
      // Shared aliases
      '@shared': path.resolve(__dirname, './src/shared'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '~/shared': path.resolve(__dirname, './src/shared'),
      // Component shortcuts
      '@components': path.resolve(__dirname, './src/shared/ui/components'),
      '@ui': path.resolve(__dirname, './src/shared/ui'),
      // Hook shortcuts
      '@hooks': path.resolve(__dirname, './src/shared/hooks'),
      // Utility shortcuts
      '@utils': path.resolve(__dirname, './src/shared/utils'),
      '@lib': path.resolve(__dirname, './src/shared/lib'),
      // Type shortcuts
      '@types': path.resolve(__dirname, './src/shared/types'),
      // Test shortcuts
      '@test': path.resolve(__dirname, './src/test'),
      // Mock blockchain libraries (for development)
      viem: path.resolve(__dirname, './src/core/tempo/mocks/viem'),
      wagmi: path.resolve(__dirname, './src/core/tempo/mocks/wagmi'),
      'tempo.ts': path.resolve(__dirname, './src/core/tempo/mocks/tempo-chains'),
      '@tanstack/react-query': path.resolve(__dirname, './src/core/tempo/mocks/react-query'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  // ========== SERVER CONFIG ==========
  server: {
    port: 5173,
    host: true,
    open: true,
    cors: true,
    // Proxy for API (if needed)
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: function (path) {
          return path.replace(/^\/api/, '');
        },
      },
    },
    // Watch for changes
    watch: {
      usePolling: false,
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
        '**/test-results/**',
      ],
    },
  },
  // ========== BUILD CONFIG ==========
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    cssMinify: true,
    // Asset handling
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Code splitting optimizations
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-state': ['zustand'],
          'vendor-utils': ['clsx', 'tailwind-merge'],
          'vendor-blockchain': ['viem', 'wagmi'],
          // Feature chunks (if large enough)
          core: ['@/core/**', 'src/core/**'],
          shared: ['@/shared/**', 'src/shared/**'],
        },
        // File naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Build optimizations
    target: 'es2020',
    chunkSizeWarningLimit: 1000,
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  // ========== PREVIEW CONFIG ==========
  preview: {
    port: 5173,
    host: true,
    open: true,
  },
  // ========== TEST CONFIG (Vitest) ==========
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts', './src/test/mocks/setup.ts'],
    // Include/exclude patterns
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/**/__tests__/**/*.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    // Mock configurations
    deps: {
      inline: ['clsx', 'tailwind-merge'],
      fallbackCJS: true,
    },
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        'src/test/**',
      ],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      },
    },
    // Test runner options
    reporters: ['default', 'html'],
    outputFile: './test-results/index.html',
    // Global test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    // UI mode (when running test:ui)
    ui: false,
    // Watch mode (when running test:watch)
    watch: false,
    // Isolate tests for better reliability
    isolate: true,
    // Type checking in tests
    typecheck: {
      enabled: true,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  // ========== ENV VARIABLES ==========
  envPrefix: ['VITE_', 'TEMPO_'],
  // ========== CSS CONFIG ==========
  css: {
    devSourcemap: true,
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  // ========== OPTIMIZE DEPENDENCIES ==========
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'clsx', 'tailwind-merge', 'viem', 'wagmi'],
    exclude: ['@tanstack/react-query', 'tempo.ts'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  // ========== LOGGING ==========
  logLevel: 'info',
  clearScreen: false,
});
