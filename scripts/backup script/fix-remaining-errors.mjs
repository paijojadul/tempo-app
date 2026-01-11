#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixRemainingErrors() {
  console.log('🔧 FIXING REMAINING TYPE ERRORS\n');

  const projectRoot = process.cwd();

  // 1. Fix App.tsx - renderModule
  await fixFile(path.join(projectRoot, 'src/app/App.tsx'), 'renderModule', 'function renderModule');

  // 2. Fix app.store.ts - useAppStore
  await fixFile(
    path.join(projectRoot, 'src/core/store/app.store.ts'),
    'useAppStore',
    'export const useAppStore'
  );

  // 3. Fix chains.ts - TEMPO_TESTNET
  await fixFile(
    path.join(projectRoot, 'src/core/tempo/chains.ts'),
    'TEMPO_TESTNET',
    'export const TEMPO_TESTNET'
  );

  console.log('\n✅ Basic fixes applied');
  console.log('\n🔍 Check remaining errors:');
  console.log('   npx tsc --noEmit');
}

async function fixFile(filePath, searchTerm, replacement) {
  try {
    await fs.access(filePath);
    let content = await fs.readFile(filePath, 'utf-8');

    if (content.includes(searchTerm)) {
      console.log(`  ✅ ${path.basename(filePath)} already has ${searchTerm}`);
      return;
    }

    // Cari pattern dengan underscore
    const underscored = `_${searchTerm}`;
    if (content.includes(underscored)) {
      content = content.replace(new RegExp(underscored, 'g'), searchTerm);
      await fs.writeFile(filePath, content);
      console.log(`  ✅ Fixed ${path.basename(filePath)}: ${underscored} → ${searchTerm}`);
    } else {
      console.log(`  ⚠️  ${path.basename(filePath)}: No ${underscored} found`);
    }
  } catch (error) {
    console.log(`  ❌ ${path.basename(filePath)}: ${error.message}`);
  }
}

fixRemainingErrors().catch(console.error);
