// scripts/audit-tempo.mjs
// READ-ONLY AUDIT — tidak mengubah file apa pun

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC_DIR = path.resolve('src');

console.log('══════════════════════════════════════');
console.log('🔍 TEMPO INTEGRATION AUDIT');
console.log('══════════════════════════════════════\n');

/* ---------------------------------- */
/* 1. Check installed tempo packages  */
/* ---------------------------------- */
console.log('📦 Checking installed tempo packages...\n');
try {
  const result = execSync('pnpm list tempo.ts', { stdio: 'pipe' }).toString();
  console.log(result);
} catch {
  console.log('❌ tempo.ts NOT FOUND via pnpm\n');
}

/* ---------------------------------- */
/* 2. Scan imports in src/             */
/* ---------------------------------- */
const matches = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');

      if (
        content.includes('tempo.ts') ||
        content.includes('tempo-ts') ||
        content.includes('Tempo')
      ) {
        matches.push({
          file: fullPath.replace(process.cwd() + '/', ''),
          tempo_ts: content.includes('tempo.ts'),
          tempo_ts_dash: content.includes('tempo-ts'),
          Tempo: content.includes('Tempo'),
        });
      }
    }
  }
}

scan(SRC_DIR);

/* ---------------------------------- */
/* 3. Report findings                  */
/* ---------------------------------- */
console.log('══════════════════════════════════════');
console.log('📂 FILES WITH TEMPO REFERENCES');
console.log('══════════════════════════════════════\n');

if (matches.length === 0) {
  console.log('✅ No tempo-related imports found\n');
} else {
  for (const m of matches) {
    console.log(`📄 ${m.file}`);
    if (m.tempo_ts) console.log('   ⚠️ contains: tempo.ts');
    if (m.tempo_ts_dash) console.log('   ⚠️ contains: tempo-ts');
    if (m.Tempo) console.log('   ⚠️ contains: Tempo');
    console.log('');
  }
}

/* ---------------------------------- */
/* 4. Check problematic file           */
/* ---------------------------------- */
const clientPath = 'src/core/tempo/client.ts';
console.log('══════════════════════════════════════');
console.log('🧨 KNOWN PROBLEM FILE CHECK');
console.log('══════════════════════════════════════\n');

if (fs.existsSync(clientPath)) {
  console.log(`⚠️ FOUND: ${clientPath}`);
  const content = fs.readFileSync(clientPath, 'utf8');
  if (content.includes('Tempo')) {
    console.log('❌ File imports or references `Tempo`');
  } else {
    console.log('ℹ️ No `Tempo` reference inside file');
  }
} else {
  console.log('✅ src/core/tempo/client.ts does NOT exist');
}

console.log('\n══════════════════════════════════════');
console.log('✅ AUDIT COMPLETE (NO CHANGES MADE)');
console.log('══════════════════════════════════════');
