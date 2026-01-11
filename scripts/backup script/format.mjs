#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const execAsync = promisify(exec);

// Konfigurasi formatting rules
const FORMAT_RULES = {
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  maxLineLength: 100,
  indentSize: 2,
  quoteStyle: 'single',
  trailingComma: 'es5',
  semicolons: true,
  importOrder: ['^react', '^@?\\w', '^modules', '^core', '^shared', '^\\.\\.', '^\\.'],
};

// Fungsi untuk membersihkan whitespace berlebihan
function cleanWhitespace(content) {
  // Hapus trailing spaces di setiap baris
  content = content.replace(/[ \t]+$/gm, '');

  // Hapus baris kosong berurutan (maksimal 2)
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  // Hapus baris kosong di awal file
  content = content.replace(/^\s*\n/, '');

  // Pastikan file diakhiri dengan newline
  content = content.trimEnd() + '\n';

  return content;
}

// Fungsi untuk mengurutkan import statements
function organizeImports(content) {
  const lines = content.split('\n');
  const imports = [];
  const otherCode = [];
  let inImportBlock = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith('import ') || trimmedLine.startsWith('import{') || inImportBlock) {
      imports.push(line);
      if (!trimmedLine.endsWith(';') && !trimmedLine.endsWith('}')) {
        inImportBlock = true;
      } else {
        inImportBlock = false;
      }
    } else if (imports.length > 0 || trimmedLine) {
      otherCode.push(line);
    }
  }

  // Kelompokkan imports berdasarkan tipe
  const groupedImports = {
    react: [],
    external: [],
    internal: [],
    relative: [],
    other: [],
  };

  imports.forEach((importLine) => {
    const importMatch = importLine.match(/from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const source = importMatch[1];

      if (source.startsWith('react')) {
        groupedImports.react.push(importLine);
      } else if (source.startsWith('@') || !source.startsWith('.')) {
        groupedImports.external.push(importLine);
      } else if (source.startsWith('../..') || source.startsWith('../../')) {
        groupedImports.internal.push(importLine);
      } else if (source.startsWith('.')) {
        groupedImports.relative.push(importLine);
      } else {
        groupedImports.other.push(importLine);
      }
    } else {
      groupedImports.other.push(importLine);
    }
  });

  // Urutkan setiap grup
  Object.values(groupedImports).forEach((group) => {
    group.sort((a, b) => {
      // Ekstrak module name untuk sorting
      const getModuleName = (str) => {
        const match = str.match(/import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/);
        return match ? match[1] : '';
      };
      return getModuleName(a).localeCompare(getModuleName(b));
    });
  });

  // Gabungkan semua imports dengan separator
  const organizedImports = [
    ...groupedImports.react,
    ...(groupedImports.react.length && groupedImports.external.length ? [''] : []),
    ...groupedImports.external,
    ...(groupedImports.external.length && groupedImports.internal.length ? [''] : []),
    ...groupedImports.internal,
    ...(groupedImports.internal.length && groupedImports.relative.length ? [''] : []),
    ...groupedImports.relative,
    ...(groupedImports.relative.length && groupedImports.other.length ? [''] : []),
    ...groupedImports.other,
  ];

  // Gabungkan kembali dengan code lainnya
  const result = [...organizedImports, ...otherCode].join('\n');
  return result;
}

// Fungsi untuk memformat file individual
async function formatFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;

    // Bersihkan whitespace
    content = cleanWhitespace(content);

    // Organize imports (untuk file TypeScript/JS)
    if (
      filePath.endsWith('.ts') ||
      filePath.endsWith('.tsx') ||
      filePath.endsWith('.js') ||
      filePath.endsWith('.jsx')
    ) {
      content = organizeImports(content);
    }

    // Cek apakah ada perubahan
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');
      return { changed: true, file: path.relative(ROOT_DIR, filePath) };
    }

    return { changed: false, file: path.relative(ROOT_DIR, filePath) };
  } catch (error) {
    console.error(`Error formatting ${filePath}:`, error.message);
    return { changed: false, file: path.relative(ROOT_DIR, filePath), error: error.message };
  }
}

// Fungsi untuk menjalankan Prettier jika tersedia
async function runPrettier(files) {
  try {
    console.log('🎨 Running Prettier...');
    const { stdout, stderr } = await execAsync(`npx prettier --write ${files.join(' ')}`);

    if (stderr && !stderr.includes('warning')) {
      console.error('Prettier stderr:', stderr);
    }

    console.log('✅ Prettier completed');
    return true;
  } catch (error) {
    console.log('⚠️  Prettier not available or failed, using basic formatting');
    return false;
  }
}

// Fungsi untuk memeriksa apakah file harus diformat
function shouldFormatFile(filePath) {
  const ext = path.extname(filePath);
  return (
    FORMAT_RULES.fileExtensions.includes(ext) &&
    !filePath.includes('node_modules') &&
    !filePath.includes('.git')
  );
}

// Fungsi utama formatting
async function runFormatting() {
  console.log('✨ Running Code Formatter\n');

  // Cari semua file
  const files = [];
  async function findFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        await findFiles(fullPath);
      } else if (entry.isFile() && shouldFormatFile(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  await findFiles(path.join(ROOT_DIR, 'src'));

  console.log(`📊 Found ${files.length} files to format\n`);

  // Coba gunakan Prettier dulu
  const prettierUsed = await runPrettier(files);

  // Jika Prettier tidak tersedia, gunakan formatter basic
  const changedFiles = [];

  if (!prettierUsed) {
    console.log('🛠️  Using basic formatter...');

    for (const filePath of files) {
      process.stdout.write(`  Processing ${path.relative(ROOT_DIR, filePath)}... `);

      const result = await formatFile(filePath);

      if (result.changed) {
        console.log('✅ updated');
        changedFiles.push(result.file);
      } else if (result.error) {
        console.log('❌ error');
      } else {
        console.log('✓ already formatted');
      }
    }
  } else {
    // Jika Prettier digunakan, cek file yang berubah
    for (const filePath of files) {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const result = await formatFile(filePath); // Masih jalankan formatter basic untuk import organization

      if (result.changed) {
        changedFiles.push(result.file);
      }
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 FORMATTING SUMMARY');
  console.log('='.repeat(50));

  if (changedFiles.length === 0) {
    console.log('✅ All files are properly formatted!');
  } else {
    console.log(`✨ Formatted ${changedFiles.length} files:`);
    changedFiles.forEach((file) => {
      console.log(`   • ${file}`);
    });
  }

  return changedFiles;
}

// Fungsi untuk membuat .prettierrc jika belum ada
async function ensurePrettierConfig() {
  const prettierrcPath = path.join(ROOT_DIR, '.prettierrc');

  try {
    await fs.access(prettierrcPath);
    console.log('✅ Prettier config already exists');
  } catch {
    console.log('📝 Creating .prettierrc config file...');

    const prettierConfig = {
      semi: FORMAT_RULES.semicolons,
      singleQuote: FORMAT_RULES.quoteStyle === 'single',
      trailingComma: FORMAT_RULES.trailingComma,
      printWidth: FORMAT_RULES.maxLineLength,
      tabWidth: FORMAT_RULES.indentSize,
      useTabs: false,
      bracketSpacing: true,
      arrowParens: 'always',
      endOfLine: 'lf',
    };

    await fs.writeFile(prettierrcPath, JSON.stringify(prettierConfig, null, 2));
    console.log('✅ Created .prettierrc');
  }
}

// Export untuk digunakan sebagai module
export { runFormatting, ensurePrettierConfig };

// Jalankan jika diakses langsung
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];

  if (command === '--init') {
    ensurePrettierConfig()
      .then(() => {
        console.log('\n✨ Formatting setup complete!');
        console.log('\nNext steps:');
        console.log('1. Install prettier: npm install --save-dev prettier');
        console.log('2. Run format script: npm run format');
      })
      .catch(console.error);
  } else {
    runFormatting()
      .then((changedFiles) => {
        if (changedFiles.length > 0) {
          console.log('\n💡 Tip: Add prettier for better formatting:');
          console.log('   npm install --save-dev prettier');
          console.log('   node scripts/format.mjs --init');
        }
      })
      .catch((error) => {
        console.error('Formatting failed:', error);
        process.exit(1);
      });
  }
}
