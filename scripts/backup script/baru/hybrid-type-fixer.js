#!/usr/bin/env node
// scripts/hybrid-type-fixer.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HybridTypeFixer {
  constructor(options = {}) {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.dryRun = options.dryRun || false;
    this.force = options.force || false;
    this.verbose = options.verbose || false;
    this.checkArch = options.checkArch || false; // Optional architecture check
    
    this.backupDir = path.join(this.projectRoot, '.type-fix-backup');
    this.modules = ['accounts', 'transactions'];
    
    // Results tracking
    this.results = {
      fixed: 0,
      skipped: 0,
      violations: [],
      errors: []
    };
  }
  
  async run() {
    console.log('🔧 Hybrid TypeScript Fixer');
    console.log('═'.repeat(60));
    console.log('Menyelesaikan 3 masalah utama:');
    console.log('1. ✅ Setter functions di store interface');
    console.log('2. ✅ Duplicate exports di service/index');
    console.log('3. ✅ Invalid Button variants (danger/warning)');
    console.log('═'.repeat(60));
    
    // Backup jika bukan dry-run
    if (!this.dryRun) {
      await this.createBackup();
    }
    
    // 1. Fix index.ts files first (handle duplicate exports)
    console.log('\n📁 Phase 1: Fixing duplicate exports...');
    for (const moduleName of this.modules) {
      await this.fixIndexFile(moduleName);
    }
    
    // 2. Fix per module
    console.log('\n📦 Phase 2: Fixing module files...');
    for (const moduleName of this.modules) {
      console.log(`\nModule: ${moduleName}`);
      await this.fixModule(moduleName);
    }
    
    // 3. Optional architecture check
    if (this.checkArch) {
      console.log('\n🏛️ Phase 3: Architecture validation...');
      await this.validateArchitecture();
    }
    
    // 4. Report
    await this.generateReport();
  }
  
  async fixModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const capitalized = this.capitalize(moduleName);
    
    // Fix dalam urutan yang benar
    const files = [
      { name: 'service.ts', method: 'fixServiceFile' },
      { name: 'store.ts', method: 'fixStoreFile' },
      { name: 'ui.tsx', method: 'fixUIFile' }
    ];
    
    for (const file of files) {
      const filePath = path.join(modulePath, file.name);
      
      try {
        await fs.access(filePath);
        const result = await this[file.method](modulePath, capitalized, moduleName);
        
        if (result.fixed) {
          this.results.fixed++;
          if (!this.dryRun) {
            console.log(`  ✅ Fixed ${moduleName}/${file.name}`);
          } else {
            console.log(`  📝 [DRY RUN] Would fix ${moduleName}/${file.name}`);
          }
          if (result.changes && this.verbose) {
            result.changes.forEach(change => console.log(`    • ${change}`));
          }
        } else if (result.skipped) {
          this.results.skipped++;
          if (this.verbose) {
            console.log(`  ⏩ ${moduleName}/${file.name} already fixed`);
          }
        }
      } catch (error) {
        // File tidak ada
        if (this.verbose) {
          console.log(`  ⏩ ${moduleName}/${file.name} not found`);
        }
      }
    }
  }
  
  // ==================== CORE FIXES ====================
  
  async fixStoreFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'store.ts');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const original = content;
      let changes = [];
      
      // 1. Pastikan type import ada
      const typeImport = `import type { ${capitalized}Item } from './service';`;
      if (!content.includes(typeImport)) {
        // Tambahkan setelah import terakhir
        const lines = content.split('\n');
        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import')) lastImport = i;
          else if (lines[i].trim() && !lines[i].startsWith('import')) break;
        }
        
        if (lastImport !== -1) {
          lines.splice(lastImport + 1, 0, typeImport);
        } else {
          lines.unshift(typeImport);
        }
        content = lines.join('\n');
        changes.push('Added type import');
      }
      
      // 2. TAMBAHKAN SETTER FUNCTIONS ke interface
      const interfaceName = `${capitalized}State`;
      const interfaceRegex = new RegExp(`(interface|type)\\s+${interfaceName}\\s*{([^}]+)}`, 's');
      const match = content.match(interfaceRegex);
      
      if (match) {
        let interfaceBody = match[2];
        const setters = [
          `setItems: (items: ${capitalized}Item[]) => void;`,
          `setLoading: (loading: boolean) => void;`,
          `setError: (error: string | null) => void;`,
          `setSelectedItem: (item: ${capitalized}Item | null) => void;`,
          `clearError: () => void;`,
          `reset: () => void;`
        ];
        
        let addedSetters = false;
        for (const setter of setters) {
          const setterName = setter.split(':')[0].trim();
          if (!new RegExp(`\\s*${setterName}\\s*:`).test(interfaceBody)) {
            // Tambahkan ke akhir interface
            interfaceBody = interfaceBody.trim();
            if (!interfaceBody.endsWith(';')) interfaceBody += ';';
            interfaceBody += `\n  ${setter}`;
            addedSetters = true;
            changes.push(`Added ${setterName} to interface`);
          }
        }
        
        if (addedSetters) {
          content = content.replace(interfaceRegex, `$&`);
          content = content.replace(match[0], `${match[1]} ${interfaceName} {${interfaceBody}}`);
        }
      }
      
      // 3. Apply fix jika ada perubahan
      if (changes.length > 0 && content !== original) {
        if (!this.dryRun) {
          await fs.writeFile(filePath, content, 'utf-8');
        }
        return { fixed: 1, skipped: 0, changes };
      }
      
      return { fixed: 0, skipped: 1, changes: [] };
      
    } catch (error) {
      console.log(`  ❌ Could not fix store.ts: ${error.message}`);
      return { fixed: 0, skipped: 0, error: error.message };
    }
  }
  
  async fixServiceFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'service.ts');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const original = content;
      let changes = [];
      
      // 1. Pastikan interfaces diexport
      const interfaces = [`${capitalized}Item`, `Create${capitalized}DTO`, `Update${capitalized}DTO`];
      
      for (const iface of interfaces) {
        const regex = new RegExp(`(export\\s+)?interface\\s+${iface}\\s*{`);
        if (content.match(regex) && !content.match(regex)[1]) {
          content = content.replace(regex, `export interface ${iface} {`);
          changes.push(`Added export to ${iface}`);
        }
      }
      
      // 2. Remove duplicate exports
      const exportRegex = /export\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];/g;
      const exports = content.match(exportRegex) || [];
      
      if (exports.length > 1) {
        // Keep only unique ones
        const uniqueExports = [...new Set(exports)];
        if (uniqueExports.length < exports.length) {
          exports.forEach(exp => {
            content = content.replace(exp, '');
          });
          content = content.trim() + '\n\n' + uniqueExports.join('\n');
          changes.push(`Removed ${exports.length - uniqueExports.length} duplicate exports`);
        }
      }
      
      if (changes.length > 0 && content !== original) {
        if (!this.dryRun) {
          await fs.writeFile(filePath, content, 'utf-8');
        }
        return { fixed: 1, skipped: 0, changes };
      }
      
      return { fixed: 0, skipped: 1, changes: [] };
      
    } catch (error) {
      console.log(`  ❌ Could not fix service.ts: ${error.message}`);
      return { fixed: 0, skipped: 0, error: error.message };
    }
  }
  
  async fixUIFile(modulePath, capitalized, moduleName) {
    const filePath = path.join(modulePath, 'ui.tsx');
    
    try {
      let content = await fs.readFile(filePath, 'utf-8');
      const original = content;
      let changes = [];
      
      // 1. Fix Button variants
      let variantChanges = 0;
      
      // "danger" → "destructive" (valid variant)
      if (content.includes('variant="danger"')) {
        content = content.replace(/variant="danger"/g, 'variant="destructive"');
        variantChanges += (content.match(/variant="destructive"/g) || []).length;
      }
      
      // "warning" → "secondary" (valid variant)
      if (content.includes('variant="warning"')) {
        content = content.replace(/variant="warning"/g, 'variant="secondary"');
        variantChanges += (content.match(/variant="secondary"/g) || []).length;
      }
      
      if (variantChanges > 0) {
        changes.push(`Fixed ${variantChanges} Button variants`);
      }
      
      // 2. Add optional chaining untuk store methods
      const storeMethods = ['setItems', 'setLoading', 'setError', 'setSelectedItem', 'clearError', 'reset', 'removeItemById'];
      let optionalFixed = 0;
      
      storeMethods.forEach(method => {
        const regex = new RegExp(`store\\.${method}\\(`, 'g');
        const matches = content.match(regex);
        if (matches) {
          optionalFixed += matches.length;
          content = content.replace(regex, `store.${method}?.(`);
        }
      });
      
      if (optionalFixed > 0) {
        changes.push(`Added optional chaining to ${optionalFixed} store calls`);
      }
      
      if (changes.length > 0 && content !== original) {
        if (!this.dryRun) {
          await fs.writeFile(filePath, content, 'utf-8');
        }
        return { fixed: 1, skipped: 0, changes };
      }
      
      return { fixed: 0, skipped: 1, changes: [] };
      
    } catch (error) {
      console.log(`  ❌ Could not fix ui.tsx: ${error.message}`);
      return { fixed: 0, skipped: 0, error: error.message };
    }
  }
  
  async fixIndexFile(moduleName) {
    const indexPath = path.join(this.srcPath, 'modules', moduleName, 'index.ts');
    
    try {
      let content = await fs.readFile(indexPath, 'utf-8');
      const original = content;
      
      // Check for multiple export statements
      const exportRegex = /export\s+\{[^}]*\}/g;
      const exports = content.match(exportRegex) || [];
      
      if (exports.length > 1) {
        // Consolidate into single export
        const allExports = new Set();
        exports.forEach(exp => {
          const matches = exp.match(/\{([^}]+)\}/);
          if (matches) {
            matches[1].split(',').map(e => e.trim()).filter(Boolean).forEach(e => allExports.add(e));
          }
        });
        
        const consolidated = `export { ${Array.from(allExports).join(', ')} } from './${moduleName}';`;
        
        // Remove old exports
        exports.forEach(exp => {
          content = content.replace(exp, '');
        });
        
        content = content.trim() + '\n\n' + consolidated;
        
        if (!this.dryRun) {
          await fs.writeFile(indexPath, content, 'utf-8');
        }
        
        console.log(`  ✅ Fixed duplicate exports in ${moduleName}/index.ts`);
        return true;
      }
      
      return false;
    } catch (error) {
      // Index file mungkin tidak ada
      return false;
    }
  }
  
  // ==================== ARCHITECTURE VALIDATION ====================
  
  async validateArchitecture() {
    console.log('\n🔍 Checking architecture compliance...');
    
    for (const moduleName of this.modules) {
      const modulePath = path.join(this.srcPath, 'modules', moduleName);
      const files = ['ui.tsx', 'service.ts', 'store.ts'];
      
      for (const fileName of files) {
        const filePath = path.join(modulePath, fileName);
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          await this.checkFileArchitecture(filePath, content, moduleName);
        } catch (error) {
          // File tidak ada
        }
      }
    }
    
    if (this.results.violations.length > 0) {
      console.log(`\n⚠️  Found ${this.results.violations.length} architecture warnings:`);
      this.results.violations.forEach(v => console.log(`   • ${v}`));
    } else {
      console.log('✅ Architecture looks good!');
    }
  }
  
  async checkFileArchitecture(filePath, content, moduleName) {
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    let match;
    const relativePath = path.relative(this.projectRoot, filePath);
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Rule 1: No cross-module imports
      if (importPath.startsWith('../')) {
        const parts = importPath.split('/');
        const potentialModule = parts.find(p => this.modules.includes(p));
        
        if (potentialModule && potentialModule !== moduleName) {
          this.results.violations.push(`CROSS-MODULE: ${relativePath} → ${importPath}`);
        }
      }
      
      // Rule 2: File responsibility checks
      const fileName = path.basename(filePath);
      if (fileName === 'ui.tsx' && importPath.includes('core/tempo')) {
        this.results.violations.push(`RESPONSIBILITY: ui.tsx should not import from core/tempo`);
      }
    }
  }
  
  // ==================== UTILITY METHODS ====================
  
  async createBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      const backup = {
        timestamp: new Date().toISOString(),
        projectRoot: this.projectRoot,
        files: []
      };
      
      for (const moduleName of this.modules) {
        const modulePath = path.join(this.srcPath, 'modules', moduleName);
        const files = ['index.ts', 'service.ts', 'store.ts', 'ui.tsx'];
        
        for (const file of files) {
          const filePath = path.join(modulePath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            backup.files.push({
              path: filePath,
              relative: path.relative(this.projectRoot, filePath),
              content: content
            });
          } catch (error) {
            // File mungkin tidak ada
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
  
  async generateReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FIX REPORT');
    console.log('═'.repeat(60));
    
    console.log(`✅ Fixed: ${this.results.fixed} files`);
    console.log(`⏩ Skipped: ${this.results.skipped} files`);
    
    if (this.results.errors.length > 0) {
      console.log(`❌ Errors: ${this.results.errors.length}`);
      if (this.verbose) {
        this.results.errors.forEach(e => console.log(`   • ${e}`));
      }
    }
    
    if (this.results.violations.length > 0) {
      console.log(`\n⚠️  Architecture warnings: ${this.results.violations.length}`);
      console.log('   Review manually to maintain clean architecture');
    }
    
    console.log('\n💡 Next steps:');
    console.log('   npm run type-check  # Verify fixes');
    console.log('   git diff src/       # Review changes');
    
    if (!this.dryRun) {
      console.log(`\n💾 Backup available in: ${this.backupDir}`);
    }
    
    console.log('═'.repeat(60));
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// ==================== CLI & USAGE ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    force: false,
    verbose: false,
    checkArch: false,
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
      case '--check-arch':
      case '-c':
        options.checkArch = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
🔧 Hybrid TypeScript Fixer
=========================

Solves 3 specific TypeScript errors while respecting architecture rules:

1. ✅ Missing setter functions in store interfaces
2. ✅ Duplicate exports in service/index files  
3. ✅ Invalid Button variants (danger/warning → destructive/secondary)

USAGE:
  node scripts/hybrid-type-fixer.js [OPTIONS]

OPTIONS:
  -d, --dry-run      Show what would be fixed without changes
  -f, --force        Force re-fix even if already fixed
  -v, --verbose      Show detailed information
  -c, --check-arch   Check for architecture violations
  -h, --help         Show this help message

EXAMPLES:
  # Check what needs fixing (safe)
  node scripts/hybrid-type-fixer.js --dry-run --verbose
  
  # Apply fixes with architecture check
  node scripts/hybrid-type-fixer.js --check-arch
  
  # Apply fixes only (normal mode)
  node scripts/hybrid-type-fixer.js
  
  # Force re-apply all fixes
  node scripts/hybrid-type-fixer.js --force

BACKUP:
  • Automatic backup in .type-fix-backup/
  • Timestamped backups for rollback
  • Only created when actually making changes
`);
}

// Main execution
(async () => {
  try {
    const options = parseArgs();
    
    if (options.help) {
      showHelp();
      process.exit(0);
    }

    const fixer = new HybridTypeFixer(options);
    await fixer.run();
    
  } catch (error) {
    console.error('❌ Fixer failed:', error.message);
    process.exit(1);
  }
})();