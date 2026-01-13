// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import boundaries from 'eslint-plugin-boundaries';

export default [
  /* ================================================== */
  /* GLOBAL IGNORE — KUNCI MASALAH ADA DI SINI           */
  /* ================================================== */
  {
    ignores: [
      '**/*',               // ⛔ default: ignore SEMUA
      '!src/**',            // ✅ KECUALI src
      '!src/**/*.{ts,tsx}', // ✅ hanya TS/TSX di src

      'node_modules/**',
      'dist/**',
      'dist-node/**',
      'coverage/**',

      // ⛔ TOOLING & SCRIPT (TOTAL IGNORE)
      'scripts/**',
      '**/*.mjs',
      '**/*.cjs',
      '**/*.js',
    ],
  },

  /* ================================================== */
  /* BASE JS (minimal)                                  */
  /* ================================================== */
  js.configs.recommended,

  /* ================================================== */
  /* APLIKASI UTAMA — SRC ONLY                          */
  /* ================================================== */
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node, // process, console AMAN
      },
    },

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
      boundaries,
    },

    /* ================= ARCHITECTURE MAP ================ */
    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'modules', pattern: 'src/modules/**' },
        { type: 'core', pattern: 'src/core/**' },
        { type: 'shared', pattern: 'src/shared/**' },
      ],
    },

    rules: {
      /* React & TS baseline */
      ...reactHooks.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      'react-hooks/exhaustive-deps': 'warn',

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Phase 4 Day 1: warning saja
      '@typescript-eslint/no-explicit-any': 'warn',

      /* ================= HARD ARCHITECTURE LOCK ================= */

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            '@/core/*',
            '@/modules/*/*',
          ],
        },
      ],

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['modules'] },
            { from: 'modules', allow: ['shared', 'core'] },
            { from: 'core', allow: [] },
            { from: 'shared', allow: ['shared'] },
          ],
        },
      ],
    },
  },
];
