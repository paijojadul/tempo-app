module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'boundaries', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  settings: {
    // 🏠 Ini daftar "alamat" folder di proyekmu
    'boundaries/elements': [
      { type: 'app', pattern: 'src/app/*' },
      { type: 'module', pattern: 'src/modules/*' },
      { type: 'core', pattern: 'src/core/*' },
      { type: 'shared', pattern: 'src/shared/*' },
    ],
  },
  rules: {
    // 🔒 ATURAN PAGAR (Siapa boleh ambil barang dari mana)
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow', // Defaultnya: dilarang semua, kecuali yang disebut di bawah:
        rules: [
          // App (Bos) boleh ambil dari mana saja
          { from: 'app', allow: ['module', 'core', 'shared'] },

          // Module (Karyawan) cuma boleh ambil dari gudang (core/shared)
          { from: 'module', allow: ['core', 'shared'] },

          // Core (Mesin) cuma boleh ambil dari alat umum (shared)
          { from: 'core', allow: ['shared'] },

          // Shared (Umum) tidak boleh ambil dari siapa-siapa
          { from: 'shared', allow: [] },
        ],
      },
    ],

    // 🚪 ATURAN PINTU DEPAN (Wajib lewat index.ts)
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

  // 🛡️ ATURAN KHUSUS (Tambahan untuk file tertentu)
  overrides: [
    {
      // Khusus untuk file yang namanya ui.tsx
      files: ['**/ui.tsx'], 
      rules: {
        // DILARANG KERAS ambil barang dari folder core
        'no-restricted-imports': [
          'error',
          {
            patterns: ['src/core/*'],
          },
        ],
      },
    },
  ],
};
