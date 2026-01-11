import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

let hasError = false;

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, cb);
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) cb(full);
  }
}

function readImports(file) {
  const content = fs.readFileSync(file, 'utf8');
  return [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

console.log('🔍 AUDIT IMPORTS\n');

walk(SRC, (file) => {
  const rel = path.relative(ROOT, file);
  const imports = readImports(file);

  for (const imp of imports) {
    // UI ❌ CORE
    if (rel.includes('/modules/') && rel.includes('/ui') && imp.startsWith('@/core')) {
      console.error(`❌ UI importing CORE: ${rel} → ${imp}`);
      hasError = true;
    }

    // SERVICE ❌ MODULE LAIN
    if (rel.includes('/service') && imp.startsWith('@/modules/')) {
      const self = rel.split('/modules/')[1].split('/')[0];
      const target = imp.split('/modules/')[1]?.split('/')[0];
      if (target && target !== self) {
        console.error(`❌ SERVICE cross-module: ${rel} → ${imp}`);
        hasError = true;
      }
    }

    // MODULE ❌ MODULE
    if (rel.includes('/modules/') && imp.startsWith('@/modules/')) {
      const self = rel.split('/modules/')[1].split('/')[0];
      const target = imp.split('/modules/')[1]?.split('/')[0];
      if (target && target !== self) {
        console.error(`❌ MODULE cross-import: ${rel} → ${imp}`);
        hasError = true;
      }
    }

    // APP ❌ CORE DIRECT
    if (rel.includes('app') && imp.startsWith('@/core')) {
      console.error(`❌ APP importing CORE directly: ${rel} → ${imp}`);
      hasError = true;
    }
  }
});

if (hasError) {
  console.error('\n🚨 IMPORT AUDIT FAILED');
  process.exit(1);
}

console.log('\n🎉 IMPORT AUDIT PASSED');
