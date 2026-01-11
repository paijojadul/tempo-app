#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const viteConfigFile = path.join(ROOT, 'vite.config.ts');

console.log('Wiring Vite entry to src/app/main.tsx...');

if (!fs.existsSync(viteConfigFile)) {
  console.error('❌ vite.config.ts not found');
  process.exit(1);
}

let content = fs.readFileSync(viteConfigFile, 'utf-8');

if (!content.includes('root:')) {
  content = content.replace(
    'export default defineConfig({',
    `export default defineConfig({
  root: '.',`
  );
}

if (!content.includes('build:')) {
  content = content.replace(
    "root: '.',",
    `root: '.',
  build: {
    rollupOptions: {
      input: 'index.html',
    },
  },`
  );
}

fs.writeFileSync(viteConfigFile, content);

console.log('✓ vite.config.ts updated');
