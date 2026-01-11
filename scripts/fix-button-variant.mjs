import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const TARGET_FILES = [
  'src/modules/accounts/ui.tsx',
  'src/modules/transactions/ui.tsx',
];

const FROM = 'variant="warning"';
const TO = 'variant="primary"';

for (const relPath of TARGET_FILES) {
  const filePath = path.join(ROOT, relPath);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  SKIP (not found): ${relPath}`);
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');

  if (!original.includes(FROM)) {
    console.log(`ℹ️  No change needed: ${relPath}`);
    continue;
  }

  const updated = original.replaceAll(FROM, TO);

  fs.writeFileSync(filePath, updated, 'utf8');

  console.log(`✅ Fixed: ${relPath}`);
}

console.log('\n🎉 DONE. Run: npx tsc --noEmit');
