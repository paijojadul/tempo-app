#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixExtraErrors() {
  console.log('🔧 EXTRA FIXES FOR REMAINING ERRORS\n');

  const projectRoot = process.cwd();

  // Fix 1: Cek apakah ada file dengan import salah
  const filesToCheck = [
    'src/core/tempo/chains.ts',
    'src/core/tempo/client.ts',
    'src/core/tempo/index.ts',
  ];

  for (const file of filesToCheck) {
    const filePath = path.join(projectRoot, file);

    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Pastikan TEMPO_TESTNET diexport dengan benar
      if (file.includes('chains.ts') && content.includes('TEMPO_TESTNET')) {
        console.log(`✅ ${file}: TEMPO_TESTNET export OK`);
      }

      // Pastikan import benar
      if (file.includes('client.ts')) {
        // Cek import chains
        if (!content.includes("from './chains'")) {
          console.log(`⚠️  ${file}: Missing chains import`);
        }
      }
    } catch (error) {
      console.log(`❌ ${file}: ${error.message}`);
    }
  }

  // Fix 2: Simple check semua file untuk underscore tersisa
  console.log('\n🔍 Checking for remaining underscores...');
  const tsFiles = await findAllTsFiles(projectRoot);

  for (const filePath of tsFiles) {
    const relativePath = path.relative(projectRoot, filePath);

    // Skip node_modules dan mocks
    if (relativePath.includes('node_modules') || relativePath.includes('mocks')) {
      continue;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Cek double underscore
      if (content.includes('__')) {
        console.log(`⚠️  ${relativePath}: Has double underscore`);
      }

      // Cek export dengan underscore
      if (content.includes('export const _') || content.includes('export function _')) {
        console.log(`⚠️  ${relativePath}: Has underscore in export`);
      }
    } catch (error) {
      // Skip
    }
  }

  console.log('\n✅ Extra checks completed');
  console.log('\n🔍 Final test:');
  console.log('   npx tsc --noEmit');
}

async function findAllTsFiles(dir) {
  const files = [];

  try {
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);

      try {
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          if (!item.includes('node_modules') && !item.includes('dist') && !item.includes('build')) {
            files.push(...(await findAllTsFiles(fullPath)));
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push(fullPath);
        }
      } catch (error) {
        // Skip
      }
    }
  } catch (error) {
    // Skip
  }

  return files;
}

fixExtraErrors().catch(console.error);
