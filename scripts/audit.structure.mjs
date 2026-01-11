import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const REQUIRED_PATHS = [
  'src/core',
  'src/core/store',
  'src/core/store/index.ts',
  'src/modules',
  'src/shared',
  'src/shared/ui',
];

const MODULES_DIR = path.join(ROOT, 'src/modules');

let hasError = false;

function checkPath(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.error(`❌ MISSING: ${relPath}`);
    hasError = true;
  } else {
    console.log(`✅ OK: ${relPath}`);
  }
}

console.log('🔍 AUDIT STRUCTURE\n');

REQUIRED_PATHS.forEach(checkPath);

if (fs.existsSync(MODULES_DIR)) {
  const modules = fs.readdirSync(MODULES_DIR).filter((d) =>
    fs.statSync(path.join(MODULES_DIR, d)).isDirectory()
  );

  for (const mod of modules) {
    const indexFile = path.join(MODULES_DIR, mod, 'index.ts');
    if (!fs.existsSync(indexFile)) {
      console.error(`❌ MODULE "${mod}" missing index.ts`);
      hasError = true;
    } else {
      console.log(`✅ MODULE "${mod}" has index.ts`);
    }
  }
}

if (hasError) {
  console.error('\n🚨 STRUCTURE AUDIT FAILED');
  process.exit(1);
}

console.log('\n🎉 STRUCTURE AUDIT PASSED');
