cat > scripts/validate-architecture.js << 'EOF'
#!/usr/bin/env node
// scripts/validate-architecture.js - Architecture Validator (Idempotent)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ArchitectureValidator {
  constructor() {
    this.violations = [];
    this.stats = { files: 0, imports: 0 };
    
    // RULES - Immutable
    this.RULES = {
      hierarchy: ['app', 'modules', 'core', 'shared'],
      forbidden: {
        'ui.tsx': ['core/tempo', 'service.ts'],
        'store.ts': ['service.ts', 'core/tempo'],
        'service.ts': ['ui.tsx', '../other-module/']
      }
    };
  }

  async run() {
    console.log('🏛️  Architecture Validator\n');
    
    // Check structure
    await this.checkStructure();
    
    // Scan and validate
    const files = await this.scanFiles('src');
    await this.validateFiles(files);
    
    // Report
    this.report();
    
    return this.violations.length === 0 ? 0 : 1;
  }

  async checkStructure() {
    console.log('📁 Checking project structure...');
    
    const dirs = [
      'src/app',
      'src/modules', 
      'src/core',
      'src/shared'
    ];
    
    for (const dir of dirs) {
      try {
        await fs.access(dir);
        console.log(`  ✅ ${dir}/`);
      } catch {
        console.log(`  ⚠️  ${dir}/ (missing)`);
      }
    }
    console.log();
  }

  async scanFiles(dir) {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await this.scanFiles(fullPath));
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
          this.stats.files++;
        }
      }
    } catch (error) {
      // Skip errors
    }
    
    return files;
  }

  async validateFiles(files) {
    console.log(`🔍 Scanning ${files.length} TypeScript files...\n`);
    
    for (const file of files) {
      await this.validateFile(file);
    }
  }

  async validateFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports = this.extractImports(content);
      
      imports.forEach(importPath => {
        this.stats.imports++;
        this.checkRules(filePath, importPath);
      });
    } catch (error) {
      // Skip read errors
    }
  }

  extractImports(content) {
    const imports = [];
    const patterns = [
      /from\s+['"]([^'"]+)['"]/g,
      /import\s+['"]([^'"]+)['"]/g,
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
      }
    });
    
    return imports;
  }

  checkRules(filePath, importPath) {
    // Rule 1: Hierarchy
    if (this.violatesHierarchy(filePath, importPath)) {
      this.addViolation(filePath, importPath, 'HIERARCHY_VIOLATION');
    }
    
    // Rule 2: Module isolation
    if (this.violatesModuleIsolation(filePath, importPath)) {
      this.addViolation(filePath, importPath, 'MODULE_ISOLATION_VIOLATION');
    }
    
    // Rule 3: File responsibility
    if (this.violatesFileResponsibility(filePath, importPath)) {
      this.addViolation(filePath, importPath, 'FILE_RESPONSIBILITY_VIOLATION');
    }
  }

  violatesHierarchy(filePath, importPath) {
    const fromLayer = this.getLayer(filePath);
    const toLayer = this.getLayer(importPath);
    
    if (!fromLayer || !toLayer) return false;
    
    const fromIdx = this.RULES.hierarchy.indexOf(fromLayer);
    const toIdx = this.RULES.hierarchy.indexOf(toLayer);
    
    // Hanya boleh import ke bawah (index lebih besar)
    return toIdx < fromIdx;
  }

  violatesModuleIsolation(filePath, importPath) {
    if (!filePath.includes('/modules/') || !importPath.includes('/modules/')) {
      return false;
    }
    
    const fromModule = this.getModuleName(filePath);
    const toModule = this.getModuleName(importPath);
    
    return fromModule && toModule && fromModule !== toModule;
  }

  violatesFileResponsibility(filePath, importPath) {
    const fileName = path.basename(filePath);
    const forbidden = this.RULES.forbidden[fileName];
    
    if (!forbidden) return false;
    
    return forbidden.some(pattern => importPath.includes(pattern));
  }

  getLayer(filePath) {
    if (filePath.includes('/app/')) return 'app';
    if (filePath.includes('/modules/')) return 'modules';
    if (filePath.includes('/core/')) return 'core';
    if (filePath.includes('/shared/')) return 'shared';
    return null;
  }

  getModuleName(filePath) {
    const match = filePath.match(/\/modules\/([^\/]+)/);
    return match ? match[1] : null;
  }

  addViolation(filePath, importPath, rule) {
    this.violations.push({
      file: path.relative(process.cwd(), filePath),
      import: importPath,
      rule: rule
    });
  }

  report() {
    console.log('📊 Scan Results:');
    console.log(`  • Files scanned: ${this.stats.files}`);
    console.log(`  • Imports checked: ${this.stats.imports}`);
    console.log(`  • Violations found: ${this.violations.length}\n`);
    
    if (this.violations.length === 0) {
      console.log('✅ All good! Architecture is clean.\n');
      return;
    }
    
    console.log('❌ Violations found:\n');
    
    // Group by file
    const byFile = {};
    this.violations.forEach(v => {
      byFile[v.file] = byFile[v.file] || [];
      byFile[v.file].push(v);
    });
    
    Object.entries(byFile).forEach(([file, violations]) => {
      console.log(`📄 ${file}:`);
      violations.forEach((v, i) => {
        console.log(`   ${i + 1}. import "${v.import}"`);
        console.log(`      └── ${this.formatRule(v.rule)}`);
      });
      console.log();
    });
    
    console.log('💡 Next steps:');
    console.log('   • Run: pnpm run fix:types --dry-run (to see fixes)');
    console.log('   • Run: pnpm run fix:types (to apply safe fixes)');
    console.log('   • Run: pnpm run create:module <name> (for new modules)');
  }

  formatRule(rule) {
    const rules = {
      'HIERARCHY_VIOLATION': 'Violates dependency hierarchy (importing upwards)',
      'MODULE_ISOLATION_VIOLATION': 'Cross-module import not allowed',
      'FILE_RESPONSIBILITY_VIOLATION': 'Import violates file responsibility'
    };
    return rules[rule] || rule;
  }
}

// Run validator
const validator = new ArchitectureValidator();
validator.run()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(error => {
    console.error('🚨 Error:', error.message);
    process.exit(2);
  });
EOF

chmod +x scripts/validate-architecture.js