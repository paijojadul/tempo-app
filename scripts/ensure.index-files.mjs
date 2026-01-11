import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MODULES_DIR = path.join(ROOT, 'src/modules');

console.log('🛠️  ENSURE index.ts FILES\n');

if (!fs.existsSync(MODULES_DIR)) {
  console.log('ℹ️  No modules directory');
  process.exit(0);
}

const modules = fs.readdirSync(MODULES_DIR).filter((d) =>
  fs.statSync(path.join(MODULES_DIR, d)).isDirectory()
);

for (const mod of modules) {
  const modDir = path.join(MODULES_DIR, mod);
  const indexFile = path.join(modDir, 'index.ts');

  if (fs.existsSync(indexFile)) {
    console.log(`✅ ${mod}/index.ts exists`);
    continue;
  }

  const content = `export * from './ui';\n`;
  fs.writeFileSync(indexFile, content, 'utf8');
  console.log(`🆕 CREATED: ${mod}/index.ts`);
}

console.log('\n🎉 INDEX ENSURE DONE');
