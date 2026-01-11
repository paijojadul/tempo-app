#!/usr/bin/env node
// scripts/fix-types-errors.js
// Quick fix untuk TypeScript errors di modules (IDEMPOTENT VERSION)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TypeErrorFixer {
  constructor(options = {}) {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.verbose = options.verbose || false;
    
    this.backupDir = path.join(this.projectRoot, '.type-fix-backup');
    
    if (this.verbose) {
      console.log('🔧 Type Error Fixer (Idempotent)');
      console.log(`📁 Project root: ${this.projectRoot}`);
      console.log(`💾 Backup dir: ${this.backupDir}`);
      console.log(`⚡ Mode: ${this.dryRun ? 'DRY RUN' : this.force ? 'FORCE' : 'NORMAL'}`);
    }
  }

  async run() {
    console.log('\n🔧 Fixing TypeScript Errors in Modules');
    console.log('═'.repeat(80));

    const modules = ['accounts', 'transactions'];
    let totalFixed = 0;
    let totalSkipped = 0;
    
    // Buat backup jika tidak dry-run
    if (!this.dryRun) {
      await this.createBackup();
    }

    for (const moduleName of modules) {
      console.log(`\n📦 Module: ${moduleName}`);
      const modulePath = path.join(this.srcPath, 'modules', moduleName);
      
      try {
        await fs.access(modulePath);
      } catch {
        console.log(`  ❌ Module directory not found: ${modulePath}`);
        continue;
      }

      const result = await this.fixModule(moduleName);
      
      if (result.fixed) {
        totalFixed += result.fixed;
        console.log(`  ✅ Fixed ${result.fixed} files`);
      }
      if (result.skipped) {
        totalSkipped += result.skipped;
        console.log(`  ⏩ Skipped ${result.skipped} files (already fixed)`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`📊 Summary:`);
    console.log(`  ✅ Fixed: ${totalFixed} files`);
    console.log(`  ⏩ Skipped: ${totalSkipped} files`);
    console.log(`  💾 Backup: ${this.backupDir}`);
    console.log('\n💡 Next steps:');
    console.log('   npm run type-check  # Verify fixes');
    console.log('   git diff src/       # Review changes');
    console.log('═'.repeat(80));
  }

  async fixModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const capitalized = this.capitalize(moduleName);
    
    const result = { fixed: 0, skipped: 0 };
    
    // 1. Check dan fix store.ts
    const storeResult = await this.fixStoreFile(modulePath, capitalized, moduleName);
    if (storeResult.fixed) result.fixed++;
    if (storeResult.skipped) result.skipped++;
    
    // 2. Check dan fix service.ts
    const serviceResult = await this.fixServiceFile(modulePath, capitalized, moduleName);
    if (serviceResult.fixed) result.fixed++;
    if (serviceResult.skipped) result.skipped++;
    
    // 3. Check dan fix ui.tsx
    const uiResult = await this.fixUIFile(modulePath, capitalized, moduleName);
    if (uiResult.fixed) result.fixed++;
    if (uiResult.skipped) result.skipped++;
    
    return result;
  }

  async fixStoreFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'store.ts');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let originalContent = content;
      let changes = [];
      
      // ===== CHECK 1: Type Import =====
      const typeImport = `import type { ${capitalized}Item } from './service';`;
      const importRegex = /import\s+type\s*{([^}]+)}\s*from\s*['"]\.\/service['"];/;
      const hasTypeImport = content.includes(typeImport);
      const hasAnyTypeImport = importRegex.test(content);
      
      if (!hasTypeImport) {
        if (hasAnyTypeImport) {
          // Replace existing dengan yang benar
          content = content.replace(importRegex, typeImport);
          changes.push('Updated type import');
        } else {
          // Tambahkan import baru di posisi yang tepat
          const lines = content.split('\n');
          let insertIndex = 0;
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
              insertIndex = i + 1;
            } else if (lines[i].trim() && !lines[i].startsWith('import')) {
              break;
            }
          }
          
          lines.splice(insertIndex, 0, typeImport);
          content = lines.join('\n');
          changes.push('Added type import');
        }
      } else {
        if (!this.force) {
          return { fixed: 0, skipped: 1, changes: [] };
        }
      }
      
      // ===== CHECK 2: Setter Functions in Interface =====
      const interfaceName = `${capitalized}State`;
      const interfaceRegex = new RegExp(`interface\\s+${interfaceName}\\s*{([^}]+)}`, 's');
      const match = content.match(interfaceRegex);
      
      if (match) {
        const interfaceContent = match[1];
        const setterFunctions = [
          `setItems: (items: ${capitalized}Item[]) => void;`,
          `setLoading: (loading: boolean) => void;`,
          `setError: (error: string | null) => void;`,
          `setSelectedItem: (item: ${capitalized}Item | null) => void;`,
          `clearError: () => void;`,
          `reset: () => void;`
        ];
        
        let updatedInterface = interfaceContent;
        let settersAdded = false;
        
        for (const setter of setterFunctions) {
          const setterName = setter.split(':')[0];
          const setterRegex = new RegExp(`\\s*${setterName}\\s*:`);
          
          if (!setterRegex.test(interfaceContent)) {
            // Temukan posisi terakhir ';' sebelum tutup interface
            const lastSemicolon = updatedInterface.lastIndexOf(';');
            if (lastSemicolon !== -1) {
              updatedInterface = 
                updatedInterface.substring(0, lastSemicolon + 1) + 
                '\n  ' + setter + 
                updatedInterface.substring(lastSemicolon + 1);
              settersAdded = true;
            }
          }
        }
        
        if (settersAdded) {
          content = content.replace(interfaceRegex, `interface ${interfaceName}{${updatedInterface}}`);
          changes.push('Added setter functions to interface');
        } else if (!this.force) {
          // Jika semua setter sudah ada dan bukan force mode, skip
          if (changes.length === 0) {
            return { fixed: 0, skipped: 1, changes: [] };
          }
        }
      }
      
      // ===== CHECK 3: useHook helper function =====
      const useHookPattern = `export function use${capitalized}`;
      if (content.includes(useHookPattern)) {
        // Pastikan removeItemById function benar
        const removeItemByIdRegex = /removeItemById:\s*\(id:\s*string\)\s*=>\s*\{([^}]+)\}/s;
        const removeMatch = content.match(removeItemByIdRegex);
        
        if (removeMatch) {
          const currentImplementation = removeMatch[0];
          const correctImplementation = `removeItemById: (id: string) => {
      const newItems = store.items.filter(item => item.id !== id);
      store.setItems(newItems);
      
      // Jika item yang selected dihapus
      if (store.selectedItem?.id === id) {
        store.setSelectedItem(null);
      }
    },`;
          
          if (currentImplementation !== correctImplementation) {
            content = content.replace(removeItemByIdRegex, correctImplementation);
            changes.push('Fixed removeItemById implementation');
          }
        }
      }
      
      // ===== TULIS PERUBAHAN =====
      if (changes.length > 0) {
        if (this.dryRun) {
          console.log(`  📝 [DRY RUN] Would fix ${moduleName}/store.ts:`);
          changes.forEach(change => console.log(`    • ${change}`));
        } else {
          await this.writeFile(filePath, content);
          console.log(`  ✅ Fixed ${moduleName}/store.ts:`);
          changes.forEach(change => console.log(`    • ${change}`));
        }
        return { fixed: 1, skipped: 0, changes };
      } else {
        if (this.verbose) {
          console.log(`  ⏩ ${moduleName}/store.ts already fixed, skipping`);
        }
        return { fixed: 0, skipped: 1, changes: [] };
      }
      
    } catch (error) {
      console.log(`  ❌ Could not fix ${moduleName}/store.ts: ${error.message}`);
      return { fixed: 0, skipped: 0, changes: [], error: error.message };
    }
  }

  async fixServiceFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'service.ts');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let changes = [];
      
      // ===== CHECK 1: Export interfaces =====
      const interfaces = [
        { name: `${capitalized}Item`, pattern: /(export\s+)?interface\s+(\w+Item)\s*{/ },
        { name: `Create${capitalized}DTO`, pattern: /(export\s+)?interface\s+(Create\w+DTO)\s*{/ },
        { name: `Update${capitalized}DTO`, pattern: /(export\s+)?interface\s+(Update\w+DTO)\s*{/ }
      ];
      
      for (const iface of interfaces) {
        const regex = new RegExp(`(export\\s+)?interface\\s+${iface.name}\\s*{`);
        const match = content.match(regex);
        
        if (match && !match[1]) {
          // Interface ada tapi belum diexport
          content = content.replace(regex, `export interface ${iface.name} {`);
          changes.push(`Added export to ${iface.name}`);
        } else if (!match) {
          // Interface tidak ditemukan, tambahkan default
          if (iface.name.includes('Item')) {
            const interfaceContent = `export interface ${iface.name} {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}`;
            
            // Tambahkan setelah import atau di awal file
            const importEnd = content.indexOf('\n\n');
            if (importEnd !== -1) {
              content = content.substring(0, importEnd + 1) + 
                       '\n' + interfaceContent + 
                       content.substring(importEnd + 1);
            } else {
              content = interfaceContent + '\n\n' + content;
            }
            changes.push(`Added missing ${iface.name} interface`);
          }
        }
      }
      
      // ===== TULIS PERUBAHAN =====
      if (changes.length > 0) {
        if (this.dryRun) {
          console.log(`  📝 [DRY RUN] Would fix ${moduleName}/service.ts:`);
          changes.forEach(change => console.log(`    • ${change}`));
        } else {
          await this.writeFile(filePath, content);
          console.log(`  ✅ Fixed ${moduleName}/service.ts:`);
          changes.forEach(change => console.log(`    • ${change}`));
        }
        return { fixed: 1, skipped: 0, changes };
      } else {
        if (this.verbose) {
          console.log(`  ⏩ ${moduleName}/service.ts already fixed, skipping`);
        }
        return { fixed: 0, skipped: 1, changes: [] };
      }
      
    } catch (error) {
      console.log(`  ❌ Could not fix ${moduleName}/service.ts: ${error.message}`);
      return { fixed: 0, skipped: 0, changes: [], error: error.message };
    }
  }

  async fixUIFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'ui.tsx');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      let changes = [];
      
      // ===== CHECK 1: variant="danger" -> "warning" =====
      if (content.includes('variant="danger"')) {
        const dangerCount = (content.match(/variant="danger"/g) || []).length;
        content = content.replace(/variant="danger"/g, 'variant="warning"');
        changes.push(`Fixed ${dangerCount} danger variants to warning`);
      }
      
      // ===== CHECK 2: Optional chaining untuk store methods =====
      const storeMethods = [
        'setItems', 'setLoading', 'setError', 'setSelectedItem',
        'clearError', 'reset', 'removeItemById'
      ];
      
      let optionalChainingFixed = 0;
      for (const method of storeMethods) {
        // Pattern untuk mencari store.method( (tanpa ?.)
        const pattern = new RegExp(`store\\.${method}\\(`, 'g');
        // Pattern untuk verifikasi
        const withoutOptionalPattern = new RegExp(`store\\.${method}\\(`, 'g');
        
        // Cek jika ada yang tanpa optional chaining
        const matches = content.match(withoutOptionalPattern) || [];
        
        if (matches.length > 0) {
          // Ganti semua dengan optional chaining
          const newContent = content.replace(pattern, `store.${method}?.(`);
          const replacedCount = (content.match(pattern) || []).length;
          
          if (newContent !== content) {
            content = newContent;
            optionalChainingFixed += replacedCount;
          }
        }
      }
      
      if (optionalChainingFixed > 0) {
        changes.push(`Added optional chaining to ${optionalChainingFixed} store methods`);
      }
      
      // ===== TULIS PERUBAHAN =====
      if (changes.length > 0) {
        if (this.dryRun) {
          console.log(`  📝 [DRY RUN] Would fix ${moduleName}/ui.tsx:`);
          changes.forEach(change => console.log(`    • ${change}`));
        } else {
          await this.writeFile(filePath, content);
          console.log(`  ✅ Fixed ${moduleName}/ui.tsx:`);
          changes.forEach(change => console.log(`    • ${change}`));
        }
        return { fixed: 1, skipped: 0, changes };
      } else {
        if (this.verbose) {
          console.log(`  ⏩ ${moduleName}/ui.tsx already fixed, skipping`);
        }
        return { fixed: 0, skipped: 1, changes: [] };
      }
      
    } catch (error) {
      console.log(`  ❌ Could not fix ${moduleName}/ui.tsx: ${error.message}`);
      return { fixed: 0, skipped: 0, changes: [], error: error.message };
    }
  }

  async writeFile(filePath, content) {
    // Validasi sederhana sebelum write
    if (this.hasDuplicateLines(content)) {
      console.warn(`  ⚠️  Warning: Possible duplicate code in ${path.basename(filePath)}`);
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async createBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      const backup = {
        timestamp: new Date().toISOString(),
        files: []
      };
      
      const modules = ['accounts', 'transactions'];
      for (const moduleName of modules) {
        const modulePath = path.join(this.srcPath, 'modules', moduleName);
        const files = ['store.ts', 'service.ts', 'ui.tsx'];
        
        for (const file of files) {
          const filePath = path.join(modulePath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            backup.files.push({
              path: filePath,
              content: content,
              module: moduleName,
              file: file
            });
          } catch (error) {
            // File mungkin tidak ada, skip
          }
        }
      }
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      
      if (this.verbose) {
        console.log(`  💾 Backup created: ${backupFile}`);
      }
      
    } catch (error) {
      console.warn(`  ⚠️  Could not create backup: ${error.message}`);
    }
  }

  hasDuplicateLines(content) {
    const lines = content.split('\n');
    const seen = new Set();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && seen.has(trimmed)) {
        return true;
      }
      seen.add(trimmed);
    }
    return false;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    force: false,
    verbose: false,
    help: false
  };

  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--force':
      case '-f':
        options.force = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

// Show help
function showHelp() {
  console.log(`
🔧 Type Error Fixer - Idempotent Version

Usage:
  node scripts/fix-types-errors.js [options]

Options:
  -d, --dry-run    Show what would be fixed without making changes
  -f, --force      Force re-fix even if already fixed
  -v, --verbose    Show detailed information
  -h, --help       Show this help message

Examples:
  # Check what needs to be fixed (safe)
  node scripts/fix-types-errors.js --dry-run --verbose
  
  # Apply fixes (normal mode)
  node scripts/fix-types-errors.js
  
  # Force re-apply all fixes
  node scripts/fix-types-errors.js --force
  
  # Apply fixes with verbose output
  node scripts/fix-types-errors.js --verbose
`);
}

// Run fixer
(async () => {
  try {
    const options = parseArgs();
    
    if (options.help) {
      showHelp();
      process.exit(0);
    }

    const fixer = new TypeErrorFixer(options);
    await fixer.run();
    
  } catch (error) {
    console.error('❌ Fixer failed:', error.message);
    if (error.stack && parseArgs().verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();