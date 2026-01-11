#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Rules arsitektur
const ARCHITECTURE_RULES = {
  allowedImports: {
    'app/*': ['modules/*', 'core/store', 'core/config'],
    'modules/*': ['core/*', 'shared/*'],
    'core/*': ['shared/*', 'core/*'], // Core boleh import dari core lain
    'shared/*': [], // Shared tidak boleh import dari tempat lain
  },
  forbiddenImports: {
    'modules/*': ['modules/*'], // Modules tidak boleh import dari module lain
    'ui.tsx': ['core/tempo/*', 'core/store'], // UI tidak boleh akses core langsung
    'store.ts': ['modules/*/ui.tsx', 'core/tempo/*'], // Store tidak tahu UI & Tempo
  },
  fileResponsibilities: {
    'ui.tsx': 'render UI + trigger action',
    'service.ts': 'bicara ke Tempo / API',
    'store.ts': 'simpan state (Zustand)',
    'index.ts': 'export publik modul',
    'core/tempo/*': 'satu-satunya pintu ke Tempo',
    'app/*': 'wiring & routing',
  },
};

// Fungsi untuk mendapatkan kategori file berdasarkan path
function getFileCategory(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);

  if (relativePath.startsWith('app/')) return 'app/*';
  if (relativePath.startsWith('modules/')) {
    // Cek apakah ini file spesifik dalam module
    const moduleName = relativePath.split('/')[1];
    const fileName = path.basename(relativePath);

    if (fileName === 'ui.tsx') return 'ui.tsx';
    if (fileName === 'store.ts') return 'store.ts';
    if (fileName === 'service.ts') return 'service.ts';
    if (fileName === 'index.ts') return 'index.ts';

    return `modules/${moduleName}/*`;
  }
  if (relativePath.startsWith('core/tempo/')) return 'core/tempo/*';
  if (relativePath.startsWith('core/')) return 'core/*';
  if (relativePath.startsWith('shared/')) return 'shared/*';

  return 'unknown';
}

// Fungsi untuk menganalisis import dalam file
async function analyzeImports(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const imports = [];

  // Regex untuk menangkap import statements
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// Fungsi untuk memeriksa apakah import diperbolehkan
function checkImportAllowed(sourceCategory, importPath, sourcePath) {
  // Skip import dari node_modules
  if (!importPath.startsWith('.')) return { allowed: true, reason: 'external' };

  const resolvedImport = path.resolve(path.dirname(sourcePath), importPath);
  const importCategory = getFileCategory(resolvedImport);

  // Cek apakah import melanggar forbiddenImports
  for (const [pattern, forbiddenDests] of Object.entries(ARCHITECTURE_RULES.forbiddenImports)) {
    if (sourceCategory.match(new RegExp(pattern.replace('*', '.*')))) {
      for (const forbiddenDest of forbiddenDests) {
        if (importCategory.match(new RegExp(forbiddenDest.replace('*', '.*')))) {
          return {
            allowed: false,
            reason: `Violation: ${sourceCategory} → ${importCategory} (${pattern} cannot import ${forbiddenDest})`,
          };
        }
      }
    }
  }

  // Cek apakah import diperbolehkan di allowedImports
  for (const [pattern, allowedDests] of Object.entries(ARCHITECTURE_RULES.allowedImports)) {
    if (sourceCategory.match(new RegExp(pattern.replace('*', '.*')))) {
      for (const allowedDest of allowedDests) {
        if (importCategory.match(new RegExp(allowedDest.replace('*', '.*')))) {
          return { allowed: true, reason: `Allowed: ${pattern} → ${allowedDest}` };
        }
      }
    }
  }

  return {
    allowed: false,
    reason: `No explicit rule for ${sourceCategory} → ${importCategory}`,
  };
}

// Fungsi untuk memeriksa struktur direktori
async function checkDirectoryStructure() {
  console.log('📁 Checking directory structure...\n');

  try {
    const expectedDirs = [
      'src/app',
      'src/core/config',
      'src/core/store',
      'src/core/tempo',
      'src/modules/accounts',
      'src/modules/payments',
      'src/modules/issuance',
      'src/modules/exchange',
      'src/shared/hooks',
      'src/shared/ui',
    ];

    const missingDirs = [];

    for (const dir of expectedDirs) {
      const fullPath = path.join(ROOT_DIR, dir);
      try {
        await fs.access(fullPath);
      } catch {
        missingDirs.push(dir);
      }
    }

    if (missingDirs.length > 0) {
      console.log('❌ Missing directories:');
      missingDirs.forEach((dir) => console.log(`   - ${dir}`));
    } else {
      console.log('✅ Directory structure is correct');
    }

    return missingDirs.length === 0;
  } catch (error) {
    console.error('Error checking directory structure:', error);
    return false;
  }
}

// Fungsi utama audit
async function runAudit() {
  console.log('🔍 Running Architecture Audit\n');

  const structureOk = await checkDirectoryStructure();

  // Cari semua file TypeScript/JS
  const files = [];
  async function findFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && entry.name !== 'node_modules') {
        await findFiles(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  await findFiles(SRC_DIR);

  console.log(`\n📊 Found ${files.length} source files`);

  let totalViolations = 0;
  const violations = [];

  // Analisis setiap file
  for (const filePath of files) {
    const relativePath = path.relative(ROOT_DIR, filePath);
    const category = getFileCategory(filePath);

    console.log(`\n📄 ${relativePath} (${category})`);

    try {
      const imports = await analyzeImports(filePath);

      for (const importPath of imports) {
        const check = checkImportAllowed(category, importPath, filePath);

        if (!check.allowed && check.reason !== 'external') {
          console.log(`   ❌ ${importPath}`);
          console.log(`      ${check.reason}`);
          totalViolations++;
          violations.push({
            file: relativePath,
            import: importPath,
            reason: check.reason,
          });
        } else if (check.reason !== 'external') {
          console.log(`   ✅ ${importPath}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error analyzing file: ${error.message}`);
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 AUDIT SUMMARY');
  console.log('='.repeat(50));

  if (totalViolations === 0) {
    console.log('✅ All files comply with architecture rules!');
  } else {
    console.log(`❌ Found ${totalViolations} architecture violations:`);
    violations.forEach((v) => {
      console.log(`\n   File: ${v.file}`);
      console.log(`   Import: ${v.import}`);
      console.log(`   Reason: ${v.reason}`);
    });

    // Generate rekomendasi perbaikan
    console.log('\n💡 RECOMMENDATIONS:');
    violations.forEach((v) => {
      console.log(`\n   For ${v.file}:`);

      if (v.reason.includes('ui.tsx cannot import core/tempo/*')) {
        console.log('   → Move Tempo access to service.ts file');
      } else if (v.reason.includes('modules/* cannot import modules/*')) {
        console.log('   → Use core/store for cross-module communication');
      } else if (v.reason.includes('store.ts cannot import core/tempo/*')) {
        console.log('   → Move Tempo access to service.ts, store should only manage state');
      }
    });
  }

  return totalViolations === 0 && structureOk;
}

// Export untuk digunakan sebagai module
export { runAudit };

// Jalankan jika diakses langsung
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAudit()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Audit failed:', error);
      process.exit(1);
    });
}
