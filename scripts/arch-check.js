#!/usr/bin/env node
// scripts/arch-check.js - Simple Architecture Checker

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkArchitecture() {
  console.log('🔍 Checking architecture rules...\n');
  console.log('📋 Rules:');
  console.log('  1. app → modules → core → shared');
  console.log('  2. modules tidak boleh import dari module lain');
  console.log('  3. ui.tsx tidak boleh import dari core/tempo');
  console.log('  4. store.ts tidak boleh import dari service/tempo\n');
  
  const violations = [];
  
  try {
    // Cek apakah struktur dasar ada
    const requiredDirs = ['src/app', 'src/modules', 'src/core', 'src/shared'];
    
    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        console.log(`✅ ${dir}/ exists`);
      } catch {
        console.log(`⚠️  ${dir}/ not found`);
      }
    }
    
    console.log('\n📁 Checking TypeScript files for import violations...');
    
    // Scan semua file TypeScript
    const files = await scanFiles('src');
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const imports = extractImports(content);
      
      for (const imp of imports) {
        const violation = checkImportRules(file, imp);
        if (violation) {
          violations.push({
            file: path.relative(process.cwd(), file),
            import: imp,
            rule: violation
          });
        }
      }
    }
    
    // Report hasil
    console.log(`\n📊 Scanned ${files.length} TypeScript files`);
    
    if (violations.length === 0) {
      console.log('\n🎉 No architecture violations found!');
      console.log('✅ Project follows clean architecture rules.');
      process.exit(0);
    } else {
      console.log(`\n❌ Found ${violations.length} violations:\n`);
      
      violations.forEach((v, i) => {
        console.log(`${i + 1}. ${v.file}`);
        console.log(`   → import "${v.import}"`);
        console.log(`   Violates: ${v.rule}\n`);
      });
      
      console.log('💡 How to fix:');
      console.log('   • Move shared code to src/shared/');
      console.log('   • Use service.ts as bridge between UI and core');
      console.log('   • Avoid cross-module imports');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('🚨 Error checking architecture:', error.message);
    process.exit(2);
  }
}

async function scanFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          files.push(...await scanFiles(fullPath));
        }
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip jika tidak bisa baca
  }
  
  return files;
}

function extractImports(content) {
  const imports = [];
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function checkImportRules(filePath, importPath) {
  const fileName = path.basename(filePath);
  
  // Rule 1: ui.tsx tidak boleh import dari core/tempo
  if (fileName === 'ui.tsx' && importPath.includes('core/tempo')) {
    return 'ui.tsx cannot import from core/tempo';
  }
  
  // Rule 2: store.ts tidak boleh import dari service
  if (fileName === 'store.ts' && (
    importPath.includes('service') || 
    importPath.includes('core/tempo')
  )) {
    return 'store.ts cannot import from service or core/tempo';
  }
  
  // Rule 3: Tidak boleh cross-module import
  if (filePath.includes('/modules/') && importPath.includes('/modules/')) {
    const fromModule = filePath.split('/modules/')[1]?.split('/')[0];
    const toModule = importPath.split('/modules/')[1]?.split('/')[0];
    
    if (fromModule && toModule && fromModule !== toModule) {
      return `Module ${fromModule} cannot import from module ${toModule}`;
    }
  }
  
  // Rule 4: Hierarchy check
  const layers = ['app', 'modules', 'core', 'shared'];
  const fromLayer = getLayer(filePath);
  const toLayer = getLayer(importPath);
  
  if (fromLayer && toLayer) {
    const fromIndex = layers.indexOf(fromLayer);
    const toIndex = layers.indexOf(toLayer);
    
    if (toIndex < fromIndex) {
      return `Cannot import from ${toLayer} to ${fromLayer} (violates hierarchy)`;
    }
  }
  
  return null;
}

function getLayer(filePath) {
  if (filePath.includes('/app/')) return 'app';
  if (filePath.includes('/modules/')) return 'modules';
  if (filePath.includes('/core/')) return 'core';
  if (filePath.includes('/shared/')) return 'shared';
  return null;
}

// Run the check
checkArchitecture();
