#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function fixImports() {
  console.log('🔧 Fixing import paths...\n');

  const files = await glob('src/**/*.{ts,tsx}');
  let fixedCount = 0;

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    let newContent = content;

    // Fix @/ alias yang error
    newContent = newContent.replace(/from\s+['"]@\/shared\/(.+)['"]/g, (match, p1) => {
      // Hitung depth dari src
      const depth = file.split('/').length - 2; // -2 karena src dan filename
      const relativePath = depth > 0 ? '../'.repeat(depth) : './';
      return `from '${relativePath}shared/${p1}'`;
    });

    if (newContent !== content) {
      await fs.writeFile(file, newContent);
      fixedCount++;
      console.log(`✅ Fixed: ${file}`);
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} files`);
}

fixImports().catch(console.error);
