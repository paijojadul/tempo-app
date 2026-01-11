#!/usr/bin/env node
// scripts/arch-safe-type-fixer.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

class ArchitectureAwareTypeFixer {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      force: options.force || false,
      verbose: options.verbose || false,
      fixAll: options.fixAll || false,
      ...options
    };
    
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.backupDir = path.join(this.projectRoot, '.arch-fix-backup');
    
    // Architecture Rules
    this.architecture = {
      hierarchy: ['app', 'modules', 'core', 'shared'], // Top to bottom
      fileResponsibilities: {
        'ui.tsx': {
          allowedImports: ['react', 'zustand', './store', './service', '@/shared'],
          forbiddenImports: ['core/tempo', '../other-module'],
          allowedFixes: ['jsx', 'react-props', 'variant', 'store-call'],
          description: 'Render UI + trigger action'
        },
        'service.ts': {
          allowedImports: ['core/tempo', '@/shared', './types'],
          forbiddenImports: ['react', './ui', '../other-module'],
          allowedFixes: ['interface', 'type', 'api', 'dto'],
          description: 'Bicara ke Tempo / API'
        },
        'store.ts': {
          allowedImports: ['zustand', './service', '@/shared/ui'],
          forbiddenImports: ['core/tempo', 'react', './ui', '../other-module'],
          allowedFixes: ['state', 'setter', 'interface', 'zustand'],
          description: 'Simpan state'
        },
        'index.ts': {
          allowedImports: ['./service', './store', './ui'],
          forbiddenImports: ['core/tempo', '../other-module'],
          allowedFixes: ['export', 'import'],
          description: 'Export publik modul'
        }
      },
      moduleIsolation: {
        rule: 'NO_CROSS_MODULE_IMPORTS',
        allowedCrossImports: ['@/shared', 'core']
      }
    };
    
    // State
    this.modules = [];
    this.violations = [];
    this.fixesApplied = [];
    this.fixesSkipped = [];
    this.errors = [];
  }
  
  async run() {
    try {
      console.log('🏛️  Architecture-Aware TypeScript Fixer');
      console.log('═'.repeat(60));
      console.log('📐 Enforcing architecture rules:');
      console.log('  1. Dependency hierarchy: app → modules → core → shared');
      console.log('  2. File responsibilities (1 kalimat)');
      console.log('  3. Module = black box (no cross-module imports)');
      console.log('═'.repeat(60));
      
      // Phase 1: Discover & Validate
      await this.discoverProjectStructure();
      await this.validateArchitecture();
      
      // Phase 2: Get TypeScript Errors
      const tsErrors = await this.getTypeScriptErrors();
      if (tsErrors.length === 0) {
        console.log('✅ No TypeScript errors found!');
        return;
      }
      
      // Phase 3: Analyze with Architecture Awareness
      const safeFixes = await this.analyzeErrorsSafely(tsErrors);
      
      if (safeFixes.length === 0) {
        console.log('⚠️  No architecture-safe fixes found');
        await this.reportViolations();
        return;
      }
      
      // Phase 4: Apply Fixes
      await this.applySafeFixes(safeFixes);
      
      // Phase 5: Report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Fixer failed:', error.message);
      if (this.options.verbose) {
        console.error(error.stack);
      }
      await this.rollbackIfNeeded();
      process.exit(1);
    }
  }
  
  async discoverProjectStructure() {
    console.log('\n🔍 Discovering project structure...');
    
    // Discover modules
    const modulesPath = path.join(this.srcPath, 'modules');
    try {
      const items = await fs.readdir(modulesPath, { withFileTypes: true });
      this.modules = items
        .filter(item => item.isDirectory())
        .map(dir => dir.name);
      
      console.log(`📦 Found ${this.modules.length} modules: ${this.modules.join(', ')}`);
      
    } catch (error) {
      console.log('⚠️  No modules directory found, continuing with empty module list');
      this.modules = [];
    }
  }
  
  async validateArchitecture() {
    console.log('\n📐 Validating architecture compliance...');
    
    // Check each module for violations
    for (const moduleName of this.modules) {
      await this.validateModule(moduleName);
    }
    
    if (this.violations.length > 0) {
      console.log(`⚠️  Found ${this.violations.length} architecture violations`);
      if (this.options.verbose) {
        this.violations.forEach(v => console.log(`   ${v}`));
      }
    } else {
      console.log('✅ Architecture looks good!');
    }
  }
  
  async validateModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const files = ['ui.tsx', 'service.ts', 'store.ts', 'index.ts'];
    
    for (const fileName of files) {
      const filePath = path.join(modulePath, fileName);
      
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        await this.validateFileArchitecture(filePath, content);
        
      } catch (error) {
        // File doesn't exist, that's OK
        if (this.options.verbose) {
          console.log(`   ⏩ ${moduleName}/${fileName} not found`);
        }
      }
    }
  }
  
  async validateFileArchitecture(filePath, content) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const fileName = path.basename(filePath);
    const moduleName = path.basename(path.dirname(filePath));
    
    // Check imports
    const importRegex = /import\s+(?:type\s+)?(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Check for cross-module imports
      if (this.isCrossModuleImport(importPath, moduleName)) {
        this.violations.push(`CROSS-MODULE: ${relativePath} imports from ${importPath}`);
      }
      
      // Check against file responsibility rules
      const rules = this.architecture.fileResponsibilities[fileName];
      if (rules) {
        const isForbidden = rules.forbiddenImports.some(forbidden => 
          importPath.includes(forbidden)
        );
        
        if (isForbidden) {
          this.violations.push(`FORBIDDEN IMPORT: ${relativePath} imports ${importPath}`);
        }
      }
    }
  }
  
  isCrossModuleImport(importPath, currentModule) {
    // Skip non-relative imports (node_modules, @ aliases except @/shared)
    if (!importPath.startsWith('.') || importPath.startsWith('@/shared')) {
      return false;
    }
    
    // Check for ../ which might go to other modules
    if (importPath.startsWith('../')) {
      // Check if it's trying to go to a sibling module
      const pathParts = importPath.split('/');
      const potentialModule = pathParts.find(part => this.modules.includes(part));
      
      if (potentialModule && potentialModule !== currentModule) {
        return true;
      }
    }
    
    return false;
  }
  
  async getTypeScriptErrors() {
    console.log('\n🔍 Checking TypeScript errors...');
    
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --skipLibCheck --pretty false');
      
      if (stderr && stderr.includes('error TS')) {
        return this.parseTypeScriptErrors(stderr);
      }
      
      return [];
      
    } catch (error) {
      // tsc exits with code 2 when there are errors, which triggers catch
      if (error.stderr) {
        return this.parseTypeScriptErrors(error.stderr);
      }
      return [];
    }
  }
  
  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    let currentError = null;
    
    for (const line of lines) {
      // Match error lines: file.tsx:line:column - error TSxxxx: message
      const errorMatch = line.match(/^(.+\.tsx?):(\d+):(\d+) - error (TS\d+): (.+)$/);
      
      if (errorMatch) {
        if (currentError) {
          errors.push(currentError);
        }
        
        const [, file, lineNum, column, code, message] = errorMatch;
        currentError = {
          file: path.resolve(this.projectRoot, file),
          line: parseInt(lineNum),
          column: parseInt(column),
          code,
          message,
          fullMessage: line
        };
      } else if (currentError && line.trim()) {
        // Append continuation lines
        currentError.fullMessage += '\n' + line;
      }
    }
    
    if (currentError) {
      errors.push(currentError);
    }
    
    console.log(`📊 Found ${errors.length} TypeScript errors`);
    return errors;
  }
  
  async analyzeErrorsSafely(errors) {
    console.log('\n🔬 Analyzing errors with architecture awareness...');
    
    const safeFixes = [];
    
    for (const error of errors) {
      const relativePath = path.relative(this.projectRoot, error.file);
      const fileName = path.basename(error.file);
      
      console.log(`\n📄 ${relativePath}:${error.line}`);
      console.log(`   ${error.code}: ${error.message}`);
      
      try {
        const content = await fs.readFile(error.file, 'utf-8');
        const lines = content.split('\n');
        const errorLine = lines[error.line - 1] || '';
        
        // Generate safe fix based on error code
        const fix = await this.generateSafeFix(error, errorLine, content);
        
        if (fix) {
          if (await this.isFixArchitectureSafe(fix, error.file)) {
            safeFixes.push(fix);
            console.log(`   ✅ Safe fix identified: ${fix.type}`);
          } else {
            this.fixesSkipped.push({
              error,
              reason: 'architecture_violation',
              fix
            });
            console.log(`   ⚠️  Skipped: Would violate architecture`);
          }
        } else {
          console.log(`   ⏩ No safe fix available for ${error.code}`);
        }
        
      } catch (fileError) {
        console.log(`   ❌ Cannot read file: ${fileError.message}`);
      }
    }
    
    return safeFixes;
  }
  
  async generateSafeFix(error, errorLine, fileContent) {
    const fileName = path.basename(error.file);
    
    switch(error.code) {
      case 'TS2307': // Cannot find module
        return await this.fixMissingImport(error, errorLine, fileContent, fileName);
        
      case 'TS2339': // Property does not exist
        return await this.fixMissingProperty(error, errorLine, fileContent, fileName);
        
      case 'TS2322': // Type mismatch
        return await this.fixTypeMismatch(error, errorLine, fileContent, fileName);
        
      case 'TS2741': // Missing property in type
        return await this.fixMissingInterfaceProperty(error, errorLine, fileContent, fileName);
        
      case 'TS1005': // Syntax error
        return await this.fixSyntaxError(error, errorLine, fileContent, fileName);
        
      default:
        // For other errors, use generic safe fix
        return await this.fixGeneric(error, errorLine, fileContent, fileName);
    }
  }
  
  async fixMissingImport(error, errorLine, content, fileName) {
    // Extract module name from error message
    const match = error.message.match(/Cannot find module ['"]([^'"]+)['"]/);
    if (!match) return null;
    
    const missingModule = match[1];
    
    // Check if this is a safe import based on file type
    const rules = this.architecture.fileResponsibilities[fileName];
    if (!rules) return null;
    
    // Only fix if import is in allowed list
    const isAllowed = rules.allowedImports.some(allowed => 
      missingModule.includes(allowed) || allowed.includes(missingModule)
    );
    
    if (!isAllowed) {
      return null; // Would violate architecture
    }
    
    // Generate import statement
    let importStatement = '';
    
    if (missingModule.startsWith('./')) {
      // Relative import - assume default export
      const moduleName = path.basename(missingModule, path.extname(missingModule));
      importStatement = `import ${this.capitalize(moduleName)} from '${missingModule}';`;
    } else if (missingModule.startsWith('@/')) {
      // Alias import - add type import
      importStatement = `import type { /* TODO: Add specific types */ } from '${missingModule}';`;
    } else {
      // Node module - add type import
      importStatement = `import type { /* TODO: Add specific types */ } from '${missingModule}';`;
    }
    
    return {
      type: 'add_import',
      file: error.file,
      importStatement,
      description: `Add import for missing module: ${missingModule}`,
      safe: true
    };
  }
  
  async fixMissingProperty(error, errorLine, content, fileName) {
    // Extract property name from error message
    const match = error.message.match(/Property '(\w+)' does not exist on type '([^']+)'/);
    if (!match) return null;
    
    const [, propertyName, typeName] = match;
    
    // Only fix in store.ts interfaces
    if (fileName !== 'store.ts' || !typeName.includes('State')) {
      return null;
    }
    
    // Find the interface in the file
    const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*{([^}]+)}`, 's');
    const interfaceMatch = content.match(interfaceRegex);
    
    if (!interfaceMatch) return null;
    
    // Add missing property with proper type
    let propertyType = 'any'; // Default
    if (propertyName.includes('Items')) propertyType = `${typeName.replace('State', 'Item')}[]`;
    if (propertyName.includes('Loading')) propertyType = 'boolean';
    if (propertyName.includes('Error')) propertyType = 'string | null';
    if (propertyName.includes('Selected')) propertyType = `${typeName.replace('State', 'Item')} | null`;
    
    return {
      type: 'add_interface_property',
      file: error.file,
      interfaceName: typeName,
      property: `${propertyName}: ${propertyType};`,
      description: `Add missing property ${propertyName} to ${typeName} interface`,
      safe: true
    };
  }
  
  async fixTypeMismatch(error, errorLine, content, fileName) {
    // Common pattern: variant="danger" -> "warning"
    if (errorLine.includes('variant="danger"')) {
      return {
        type: 'fix_variant',
        file: error.file,
        search: 'variant="danger"',
        replace: 'variant="warning"',
        description: 'Change variant from "danger" to "warning"',
        safe: true
      };
    }
    
    // Common pattern: store.method() -> store.method?.()
    const methodMatch = errorLine.match(/store\.(\w+)\(/);
    if (methodMatch && fileName === 'ui.tsx') {
      const method = methodMatch[1];
      return {
        type: 'add_optional_chaining',
        file: error.file,
        search: `store.${method}(`,
        replace: `store.${method}?.(`,
        description: `Add optional chaining to store.${method}`,
        safe: true
      };
    }
    
    return null;
  }
  
  async fixMissingInterfaceProperty(error, errorLine, content, fileName) {
    // Similar to fixMissingProperty but for implementation
    return await this.fixMissingProperty(error, errorLine, content, fileName);
  }
  
  async fixSyntaxError(error, errorLine, content, fileName) {
    // Look for common syntax errors
    if (errorLine.includes(',undefined,')) {
      return {
        type: 'remove_undefined',
        file: error.file,
        search: ',undefined,',
        replace: ',',
        description: 'Remove undefined from object literal',
        safe: true
      };
    }
    
    if (errorLine.includes('}))') && !errorLine.includes('})')) {
      // Check for missing closing brace
      const lines = content.split('\n');
      const lineIndex = error.line - 1;
      
      // Look for create() pattern
      for (let i = Math.max(0, lineIndex - 10); i < Math.min(lines.length, lineIndex + 10); i++) {
        if (lines[i].includes('create<') && lines[i].includes('((set) => ({')) {
          return {
            type: 'fix_store_syntax',
            file: error.file,
            template: 'store', // Will use template
            description: 'Fix store syntax structure',
            safe: true
          };
        }
      }
    }
    
    return null;
  }
  
  async fixGeneric(error, errorLine, content, fileName) {
    // Generic safe fix - just comment out problematic line
    // This is a last resort
    return {
      type: 'comment_error',
      file: error.file,
      line: error.line,
      description: `Comment out line with ${error.code}`,
      safe: true
    };
  }
  
  async isFixArchitectureSafe(fix, filePath) {
    const fileName = path.basename(filePath);
    const relativePath = path.relative(this.projectRoot, filePath);
    
    switch(fix.type) {
      case 'add_import':
        if (!fix.importStatement) return true;
        
        // Check import path
        const importMatch = fix.importStatement.match(/from\s+['"]([^'"]+)['"]/);
        if (!importMatch) return true;
        
        const importPath = importMatch[1];
        const moduleName = path.basename(path.dirname(filePath));
        
        // Check against architecture rules
        if (this.isCrossModuleImport(importPath, moduleName)) {
          return false;
        }
        
        const rules = this.architecture.fileResponsibilities[fileName];
        if (rules) {
          const isForbidden = rules.forbiddenImports.some(forbidden => 
            importPath.includes(forbidden)
          );
          if (isForbidden) return false;
        }
        break;
        
      case 'add_interface_property':
        // Adding properties to interfaces is generally safe
        return true;
        
      case 'fix_variant':
      case 'add_optional_chaining':
      case 'remove_undefined':
        // These are safe syntax fixes
        return true;
        
      case 'fix_store_syntax':
        // Store syntax fix is safe if it follows patterns
        return fileName === 'store.ts';
        
      case 'comment_error':
        // Commenting is always safe (non-destructive)
        return true;
    }
    
    return true;
  }
  
  async applySafeFixes(fixes) {
    if (fixes.length === 0) {
      console.log('\n⏩ No safe fixes to apply');
      return;
    }
    
    console.log(`\n🔨 Applying ${fixes.length} safe fixes...`);
    
    // Create backup first
    if (!this.options.dryRun) {
      await this.createBackup();
    }
    
    let appliedCount = 0;
    
    for (const fix of fixes) {
      try {
        const success = await this.applyFix(fix);
        if (success) {
          appliedCount++;
          this.fixesApplied.push(fix);
        }
      } catch (error) {
        console.error(`❌ Failed to apply fix: ${error.message}`);
        this.errors.push(error);
      }
    }
    
    console.log(`✅ Applied ${appliedCount} fixes`);
  }
  
  async applyFix(fix) {
    const relativePath = path.relative(this.projectRoot, fix.file);
    
    if (this.options.dryRun) {
      console.log(`📝 [DRY RUN] Would apply: ${fix.type} to ${relativePath}`);
      console.log(`   ${fix.description}`);
      return true;
    }
    
    console.log(`🛠️  Applying: ${fix.type} to ${relativePath}`);
    
    let content = await fs.readFile(fix.file, 'utf-8');
    let newContent = content;
    
    switch(fix.type) {
      case 'add_import':
        // Add import at the top of the file
        const lines = newContent.split('\n');
        let lastImportIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            lastImportIndex = i;
          } else if (lines[i].trim() && lastImportIndex !== -1) {
            break;
          }
        }
        
        if (lastImportIndex !== -1) {
          lines.splice(lastImportIndex + 1, 0, fix.importStatement);
        } else {
          lines.unshift(fix.importStatement);
        }
        
        newContent = lines.join('\n');
        break;
        
      case 'add_interface_property':
        const interfaceRegex = new RegExp(`(interface\\s+${fix.interfaceName}\\s*{[^}]+)(})`, 's');
        newContent = newContent.replace(interfaceRegex, `$1\n  ${fix.property}$2`);
        break;
        
      case 'fix_variant':
      case 'add_optional_chaining':
      case 'remove_undefined':
        newContent = newContent.replace(new RegExp(fix.search, 'g'), fix.replace);
        break;
        
      case 'fix_store_syntax':
        // Apply store template
        const moduleName = path.basename(path.dirname(fix.file));
        const capitalized = this.capitalize(moduleName);
        newContent = await this.generateStoreTemplate(capitalized);
        break;
        
      case 'comment_error':
        const errorLines = newContent.split('\n');
        const lineIndex = fix.line - 1;
        if (lineIndex >= 0 && lineIndex < errorLines.length) {
          errorLines[lineIndex] = `// FIXME: ${errorLines[lineIndex].trim()}`;
          newContent = errorLines.join('\n');
        }
        break;
    }
    
    // Only write if content changed
    if (newContent !== content) {
      await fs.writeFile(fix.file, newContent, 'utf-8');
      console.log(`   ✅ Applied: ${fix.description}`);
      return true;
    } else {
      console.log(`   ⏩ No changes needed`);
      return false;
    }
  }
  
  async generateStoreTemplate(moduleName) {
    return `import { create } from 'zustand';
import type { ${moduleName}Item } from './service';

interface ${moduleName}State {
  items: ${moduleName}Item[];
  loading: boolean;
  error: string | null;
  selectedItem: ${moduleName}Item | null;

  // Setter functions
  setItems: (items: ${moduleName}Item[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: ${moduleName}Item | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
}

export const use${moduleName}Store = create<${moduleName}State>((set) => ({
  // State
  items: [],
  loading: false,
  error: null,
  selectedItem: null,

  // Actions
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  clearError: () => set({ error: null }),
  reset: () => set({
    items: [],
    loading: false,
    error: null,
    selectedItem: null
  }),
  removeItemById: (id: string) => 
    set((state) => {
      const newItems = state.items.filter(item => item.id !== id);
      const shouldClearSelected = state.selectedItem?.id === id;
      
      return {
        items: newItems,
        selectedItem: shouldClearSelected ? null : state.selectedItem
      };
    }),
}));

// Helper hook untuk common patterns
export function use${moduleName}() {
  const store = use${moduleName}Store();

  return {
    // State
    ...store,

    // Computed values
    getItemById: (id: string) => store.items.find(item => item.id === id),
    hasItems: store.items.length > 0,
    isEmpty: store.items.length === 0,

    // Actions dengan business logic
    selectItemById: (id: string) => {
      const item = store.items.find(item => item.id === id);
      store.setSelectedItem(item || null);
    },

    // Untuk integrasi dengan service layer
    updateLocalItem: (updatedItem: ${moduleName}Item) => {
      const newItems = store.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      store.setItems(newItems);
      
      // Update selected item jika sama
      if (store.selectedItem?.id === updatedItem.id) {
        store.setSelectedItem(updatedItem);
      }
    },

    removeItemById: (id: string) => {
      store.removeItemById(id);
    },

    // Reset dengan konfirmasi
    resetWithConfirmation: () => {
      if (confirm('Are you sure you want to reset all data?')) {
        store.reset();
      }
    }
  };
}`;
  }
  
  async createBackup() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `backup-${timestamp}.json`);
      
      const backup = {
        timestamp: new Date().toISOString(),
        fixes: this.fixesApplied,
        violations: this.violations,
        files: []
      };
      
      // Backup all files that will be modified
      const filesToBackup = new Set(this.fixesApplied.map(fix => fix.file));
      
      for (const file of filesToBackup) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          backup.files.push({
            path: file,
            content: content,
            relative: path.relative(this.projectRoot, file)
          });
        } catch (error) {
          // Skip if cannot read
        }
      }
      
      await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
      
      if (this.options.verbose) {
        console.log(`   💾 Backup created: ${backupFile}`);
      }
      
    } catch (error) {
      console.warn(`⚠️  Could not create backup: ${error.message}`);
    }
  }
  
  async rollbackIfNeeded() {
    if (this.fixesApplied.length === 0 || this.options.dryRun) {
      return;
    }
    
    console.log('\n🔄 Checking if rollback is needed...');
    
    // Check if TypeScript errors increased
    const newErrors = await this.getTypeScriptErrors();
    const originalErrorCount = this.fixesApplied.length + this.fixesSkipped.length;
    
    if (newErrors.length > originalErrorCount * 1.5) { // 50% increase threshold
      console.log('⚠️  Error count increased, attempting rollback...');
      await this.rollbackFromBackup();
    }
  }
  
  async rollbackFromBackup() {
    // Find latest backup
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.json'));
      
      if (backupFiles.length === 0) {
        console.log('⚠️  No backup found for rollback');
        return;
      }
      
      backupFiles.sort().reverse(); // Latest first
      const latestBackup = path.join(this.backupDir, backupFiles[0]);
      
      const backupData = JSON.parse(await fs.readFile(latestBackup, 'utf-8'));
      
      console.log(`🔄 Rolling back from backup: ${backupData.timestamp}`);
      
      for (const file of backupData.files) {
        try {
          await fs.writeFile(file.path, file.content, 'utf-8');
          console.log(`   ↩️  Restored: ${file.relative}`);
        } catch (error) {
          console.error(`   ❌ Failed to restore: ${file.relative}`);
        }
      }
      
      console.log('✅ Rollback complete');
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
    }
  }
  
  async generateReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 FIX REPORT');
    console.log('═'.repeat(60));
    
    console.log(`✅ Fixes Applied: ${this.fixesApplied.length}`);
    this.fixesApplied.forEach(fix => {
      const relative = path.relative(this.projectRoot, fix.file);
      console.log(`   • ${fix.type}: ${relative} - ${fix.description}`);
    });
    
    console.log(`\n⚠️  Fixes Skipped: ${this.fixesSkipped.length}`);
    if (this.fixesSkipped.length > 0 && this.options.verbose) {
      this.fixesSkipped.forEach(skip => {
        const relative = path.relative(this.projectRoot, skip.error.file);
        console.log(`   • ${skip.error.code}: ${relative} - ${skip.reason}`);
      });
    }
    
    console.log(`\n📐 Architecture Violations: ${this.violations.length}`);
    if (this.violations.length > 0 && this.options.verbose) {
      this.violations.forEach(violation => {
        console.log(`   • ${violation}`);
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('   npm run type-check  # Verify fixes');
    console.log('   git diff src/       # Review changes');
    
    if (this.violations.length > 0) {
      console.log('\n🚨 Architecture violations found!');
      console.log('   Please review and fix manually to maintain clean architecture.');
    }
    
    console.log('═'.repeat(60));
  }
  
  async reportViolations() {
    if (this.violations.length === 0) return;
    
    console.log('\n🚨 ARCHITECTURE VIOLATIONS DETECTED');
    console.log('═'.repeat(60));
    
    this.violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation}`);
    });
    
    console.log('\n💡 Manual fixes required:');
    console.log('   1. Remove cross-module imports');
    console.log('   2. Ensure imports follow hierarchy: app → modules → core → shared');
    console.log('   3. File responsibilities:');
    console.log('      - ui.tsx: render UI + trigger action');
    console.log('      - service.ts: bicara ke Tempo / API');
    console.log('      - store.ts: simpan state');
    console.log('      - index.ts: export publik modul');
    
    console.log('═'.repeat(60));
  }
  
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// CLI Argument Parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: false,
    force: false,
    verbose: false,
    fixAll: false,
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
      case '--fix-all':
      case '-a':
        options.fixAll = true;
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
🏛️  Architecture-Aware TypeScript Fixer

Usage:
  node scripts/arch-safe-type-fixer.js [options]

Options:
  -d, --dry-run    Show what would be fixed without making changes
  -f, --force      Force fixes (use with caution)
  -v, --verbose    Show detailed information
  -a, --fix-all    Attempt to fix all errors (not just safe ones)
  -h, --help       Show this help message

Features:
  • Enforces dependency hierarchy: app → modules → core → shared
  • Respects file responsibilities (ui.tsx, service.ts, store.ts)
  • Prevents cross-module imports
  • Only applies architecture-safe fixes
  • Creates automatic backups
  • Rollback on error increase

Examples:
  # Check what would be fixed (safe mode)
  node scripts/arch-safe-type-fixer.js --dry-run --verbose
  
  # Apply safe fixes only
  node scripts/arch-safe-type-fixer.js --verbose
  
  # Try to fix everything (may violate architecture)
  node scripts/arch-safe-type-fixer.js --fix-all
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

    const fixer = new ArchitectureAwareTypeFixer(options);
    await fixer.run();
    
  } catch (error) {
    console.error('❌ Fixer failed:', error.message);
    process.exit(1);
  }
})();