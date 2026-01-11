// eslint.config.ts
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    plugins: {
      boundaries,
      import: importPlugin,
    },

    settings: {
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/*' },
        { type: 'module', pattern: 'src/modules/*' },
        { type: 'core', pattern: 'src/core/*' },
        { type: 'shared', pattern: 'src/shared/*' },
      ],
    },

    rules: {
      // 🔒 RULE UTAMA: ARAH DEPENDENSI
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app', allow: ['module', 'core', 'shared'] },
            { from: 'module', allow: ['core', 'shared'] },
            { from: 'core', allow: ['shared'] },
            { from: 'shared', allow: [] },
          ],
        },
      ],

      // 🚪 WAJIB MASUK VIA index.ts
      'import/no-internal-modules': [
        'error',
        {
          allow: [
            'src/**/index',
            'src/**/index.ts',
          ],
        },
      ],
    },
  },

  // 🔥 RULE KHUSUS UI
  {
    files: ['**/ui.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@core/*', 'src/core/*'],
        },
      ],
    },
  },
];
