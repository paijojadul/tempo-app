#!/usr/bin/env node
// scripts/check-all-stores.js
import fs from 'fs/promises';
import path from 'path';

async function checkStoreFile(moduleName) {
  const storePath = path.join(process.cwd(), 'src/modules', moduleName, 'store.ts');
  
  try {
    const content = await fs.readFile(storePath, 'utf-8');
    const lines = content.split('\n');
    
    return {
      exists: true,
      isEmpty: content.trim() === '' || content.trim() === 'export {};',
      hasZustand: content.includes("from 'zustand'"),
      hasCreate: content.includes('create<'),
      hasInterface: /interface \w+State/.test(content),
      lineCount: lines.length,
      preview: lines.slice(0, 3).join(' ') + '...'
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Checking all store files...\n');
  
  const modules = ['accounts', 'exchange', 'issuance', 'payments', 'transactions'];
  
  console.log('MODULE           STATUS           LINES  PREVIEW');
  console.log('════════════════════════════════════════════════════');
  
  for (const moduleName of modules) {
    const check = await checkStoreFile(moduleName);
    
    let status = '❓ UNKNOWN';
    let details = '';
    
    if (!check.exists) {
      status = '❌ MISSING';
      details = check.error;
    } else if (check.isEmpty) {
      status = '⚠️  EMPTY';
      details = 'Only export {} or empty';
    } else if (!check.hasZustand || !check.hasCreate) {
      status = '⚠️  INCOMPLETE';
      details = 'Missing zustand/create pattern';
    } else if (!check.hasInterface) {
      status = '⚠️  NO INTERFACE';
      details = 'Missing State interface';
    } else {
      status = '✅ OK';
      details = 'Complete store pattern';
    }
    
    console.log(
      `${moduleName.padEnd(15)} ${status.padEnd(16)} ${check.exists ? check.lineCount.toString().padStart(5) : '     '}  ${check.preview || details}`
    );
  }
  
  console.log('\n💡 Recommendations:');
  console.log('   ✅ accounts, transactions - Already perfect, keep as is');
  console.log('   ⚠️  exchange, issuance, payments - Need review');
  console.log('\n🔧 Run: node scripts/align-store-patterns.js to fix incomplete stores');
}

main().catch(console.error);