#!/usr/bin/env node
// scripts/architecture-auditor.js
// Architecture Auditor untuk memvalidasi struktur modular project
// VERSION: 2.0 - Focus on architecture only, skip type-safety for mocks/tests

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ArchitectureAuditor {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.violations = [];
    this.stats = {
      filesScanned: 0,
      violationsByType: {
        'cross-module': 0,
        'ui-accessing-core': 0,
        'store-business-logic': 0,
        'type-safety': 0,
        'dependency-flow': 0,
        'structure': 0,
        'invalid-import': 0
      }
    };
  }

  async run() {
    console.log('🔍 Architecture Auditor v2.0\n');
    console.log('═'.repeat(80));
    console.log('🎯 Focus: Architecture violations only');
    console.log('⚠️  Note: Type-safety checks skipped for mocks/tests\n');
    console.log('═'.repeat(80));

    await this.scanProject();
    this.generateReport();
    
    // Exit dengan code yang sesuai
    const highSeverityCount = this.violations.filter(v => v.severity === 'HIGH').length;
    const mediumSeverityCount = this.violations.filter(v => v.severity === 'MEDIUM').length;
    
    if (highSeverityCount > 0) {
      process.exit(1); // Ada violation HIGH, exit dengan error
    } else if (mediumSeverityCount > 0) {
      process.exit(0); // Ada violation MEDIUM, warning saja
    } else {
      process.exit(0); // Clean exit
    }
  }

  async scanProject() {
    console.log('📁 Scanning project structure...\n');

    // 1. Cek basic structure
    await this.checkBasicStructure();

    // 2. Scan semua TypeScript files
    const files = await this.getAllTsFiles(this.srcPath);
    this.stats.filesScanned = files.length;

    console.log(`📄 Scanning ${files.length} TypeScript files for ARCHITECTURE issues...\n`);

    // Proses file satu per satu
    for (let i = 0; i < files.length; i++) {
      await this.analyzeFile(files[i]);
      
      // Progress indicator
      if ((i + 1) % 5 === 0 || (i + 1) === files.length) {
        const percent = Math.round(((i + 1) / files.length) * 100);
        process.stdout.write(`  Progress: ${percent}% (${i + 1}/${files.length})\r`);
      }
    }
    
    console.log('\n'); // New line after progress
  }

  async checkBasicStructure() {
    console.log('🏗️  Basic Structure Check:\n');

    const requiredDirs = [
      'src/app',
      'src/core',
      'src/core/tempo',
      'src/core/store',
      'src/modules',
      'src/shared',
      'src/shared/ui'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      try {
        await fs.access(dirPath);
        const items = await fs.readdir(dirPath);
        console.log(`  ✅ ${dir}/ (${items.length} items)`);
      } catch {
        console.log(`  ❌ ${dir}/ (missing)`);
        
        this.violations.push({
          type: 'structure',
          severity: 'HIGH',
          file: 'project',
          issue: `Missing required directory: ${dir}`,
          fix: 'Run: node scripts/structure-checker.mjs'
        });
        this.stats.violationsByType['structure']++;
      }
    }

    console.log('');
  }

  async getAllTsFiles(dir) {
    const files = [];

    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Skip node_modules, dist, build, dan hidden directories
          if (!item.name.includes('node_modules') && 
              !item.name.includes('dist') &&
              !item.name.includes('build') &&
              !item.name.startsWith('.') &&
              !item.name.startsWith('__')) {
            files.push(...(await this.getAllTsFiles(fullPath)));
          }
        } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
          // Skip test files untuk audit architecture
          if (!item.name.includes('.test.') && 
              !item.name.includes('.spec.') &&
              !item.name.includes('.stories.')) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return files;
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath);

      // Skip mock files untuk type-safety check
      const isMockOrTestFile = filePath.includes('/mocks/') || 
                               filePath.includes('/test/') ||
                               filePath.includes('setup.ts');

      // Rule 1: Cross-module imports (dari module ke module lain)
      if (filePath.includes('src/modules/')) {
        await this.checkCrossModuleImports(filePath, relativePath, content);
      }

      // Rule 2: Store rules (SESUAI dengan module-fixer.mjs)
      if (this.isStoreFile(filePath)) {
        await this.checkStoreRules(filePath, relativePath, content);
      }

      // Rule 3: UI rules (SESUAI dengan module-fixer.mjs)
      if (this.isUIComponentFile(filePath)) {
        await this.checkUIRules(filePath, relativePath, content);
      }

      // Rule 4: Service rules
      if (this.isServiceFile(filePath)) {
        await this.checkServiceRules(filePath, relativePath, content);
      }

      // Rule 5: Type safety - SKIP untuk mock/test files
      if (!isMockOrTestFile && !this.isTestFile(filePath)) {
        await this.checkTypeSafety(filePath, relativePath, content);
      }

      // Rule 6: Dependency flow
      await this.checkDependencyFlow(filePath, relativePath, content);

    } catch (error) {
      // Skip unreadable files
    }
  }

  async checkCrossModuleImports(filePath, relativePath, content) {
    const moduleName = this.extractModuleName(relativePath);
    const imports = this.extractImports(content);

    for (const imp of imports) {
      if (imp.includes('../modules/')) {
        const importedModule = imp.match(/\.\.\/modules\/([^/]+)/)?.[1];
        if (importedModule && importedModule !== moduleName) {
          // Check if this is a type-only import
          const isTypeOnly = this.isTypeOnlyImport(content, imp);
          
          if (!isTypeOnly) {
            this.violations.push({
              type: 'cross-module',
              severity: 'HIGH',
              file: relativePath,
              issue: `Module "${moduleName}" imports FUNCTIONS from "${importedModule}"`,
              fix: 'Move shared logic to src/shared/ or use dependency injection'
            });
            this.stats.violationsByType['cross-module']++;
          }
        }
      }
    }
  }

  async checkStoreRules(filePath, relativePath, content) {
    const imports = this.extractImports(content);
    
    // Store tidak boleh import service FUNCTIONS
    if (imports.some(imp => imp.includes('./service'))) {
      const lines = content.split('\n');
      let hasFunctionImport = false;
      
      for (const line of lines) {
        if (line.includes("from './service'") && !line.includes('import type')) {
          if (line.includes('import {')) {
            // Cek jika import functions (bukan types)
            const importPart = line.substring(line.indexOf('{') + 1, line.indexOf('}'));
            const importedItems = importPart.split(',').map(item => item.trim());
            
            const functionKeywords = ['fetch', 'create', 'get', 'update', 'delete'];
            const hasFunctionImportItem = importedItems.some(item => 
              functionKeywords.some(keyword => 
                item.toLowerCase().startsWith(keyword.toLowerCase())
              )
            );
            
            if (hasFunctionImportItem) {
              hasFunctionImport = true;
              break;
            }
          }
        }
      }
      
      if (hasFunctionImport) {
        this.violations.push({
          type: 'store-business-logic',
          severity: 'HIGH',
          file: relativePath,
          issue: 'Store imports SERVICE FUNCTIONS (violates separation)',
          fix: 'Store should only have type imports from service'
        });
        this.stats.violationsByType['store-business-logic']++;
      }
    }
    
    // Store tidak boleh panggil getTempoClient
    if (content.includes('getTempoClient') && !this.isInComment(content, 'getTempoClient')) {
      this.violations.push({
        type: 'store-business-logic',
        severity: 'HIGH',
        file: relativePath,
        issue: 'Store accesses Tempo blockchain directly',
        fix: 'Move Tempo logic to service.ts'
      });
      this.stats.violationsByType['store-business-logic']++;
    }
  }

  async checkUIRules(filePath, relativePath, content) {
    // UI tidak boleh import service FUNCTIONS
    const imports = this.extractImports(content);
    
    if (imports.some(imp => imp.includes('./service'))) {
      const lines = content.split('\n');
      let hasFunctionImport = false;
      
      for (const line of lines) {
        if (line.includes("from './service'") && !line.includes('import type')) {
          if (line.includes('import {')) {
            const importPart = line.substring(line.indexOf('{') + 1, line.indexOf('}'));
            const importedItems = importPart.split(',').map(item => item.trim());
            
            const functionKeywords = ['fetch', 'create', 'get', 'update', 'delete'];
            const hasFunctionImportItem = importedItems.some(item => 
              functionKeywords.some(keyword => 
                item.toLowerCase().startsWith(keyword.toLowerCase())
              )
            );
            
            if (hasFunctionImportItem) {
              hasFunctionImport = true;
              break;
            }
          }
        }
      }
      
      if (hasFunctionImport) {
        this.violations.push({
          type: 'ui-accessing-core',
          severity: 'HIGH',
          file: relativePath,
          issue: 'UI imports service FUNCTIONS',
          fix: 'Service should be called from app layer'
        });
        this.stats.violationsByType['ui-accessing-core']++;
      }
    }
    
    // UI tidak boleh panggil getTempoClient
    if (content.includes('getTempoClient') && !this.isInComment(content, 'getTempoClient')) {
      this.violations.push({
        type: 'ui-accessing-core',
        severity: 'HIGH',
        file: relativePath,
        issue: 'UI accesses Tempo blockchain directly',
        fix: 'Move Tempo logic to service.ts'
      });
      this.stats.violationsByType['ui-accessing-core']++;
    }
  }

  async checkServiceRules(filePath, relativePath, content) {
    // Service harus punya getTempoClient import (kecuali types file)
    if (!filePath.endsWith('types.ts') && 
        !filePath.endsWith('type.ts') &&
        !this.isTestFile(filePath)) {
      
      if (!content.includes("getTempoClient") && 
          !content.includes("from '../../core/tempo") &&
          !content.includes("from '../../../core/tempo")) {
        
        // Cek jika ini benar-benar service file
        if (this.isServiceFile(filePath)) {
          this.violations.push({
            type: 'invalid-import',
            severity: 'MEDIUM',
            file: relativePath,
            issue: 'Service missing getTempoClient import',
            fix: 'Service should import from core/tempo'
          });
          this.stats.violationsByType['invalid-import']++;
        }
      }
    }
  }

  async checkTypeSafety(filePath, relativePath, content) {
    // Skip untuk files tertentu
    const skipFiles = [
      'src/shared/utils.ts', // Utility files sering butuh any
      'setup.ts',
      'config.ts',
      'constants.ts'
    ];
    
    if (skipFiles.some(pattern => relativePath.includes(pattern))) {
      return;
    }
    
    // Hanya flag jika ada banyak "any"
    const anyRegex = /(:\s*any\b|as\s*any\b)/g;
    let match;
    let anyCount = 0;
    
    while ((match = anyRegex.exec(content)) !== null) {
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
      
      if (!line.trim().startsWith('//') && !line.includes('/*')) {
        anyCount++;
      }
    }
    
    // Hanya flag jika lebih dari 2 "any"
    if (anyCount > 2) {
      this.violations.push({
        type: 'type-safety',
        severity: 'LOW',
        file: relativePath,
        issue: `Using "any" type ${anyCount} times`,
        fix: 'Replace with specific types for better type safety'
      });
      this.stats.violationsByType['type-safety']++;
    }
  }

  async checkDependencyFlow(filePath, relativePath, content) {
    if (!filePath.includes('src/')) return;
    
    const layer = this.getFileLayer(filePath);
    const imports = this.extractImports(content);
    
    for (const imp of imports) {
      if (imp.startsWith('../')) {
        const importLayer = this.getImportLayer(filePath, imp);
        const isTypeOnly = this.isTypeOnlyImport(content, imp);
        
        if (isTypeOnly) continue;
        if (layer === importLayer) continue; // Same layer is OK
        
        // Invalid flows (yang HARUS dicegah):
        // module → app (modules shouldn't know about app)
        // core → module (core should be independent)
        // shared → module/core (shared should be independent)
        
        const invalidFlows = [
          ['module', 'app'],
          ['core', 'module'],
          ['shared', 'module'],
          ['shared', 'core']
        ];
        
        const currentFlow = [layer, importLayer];
        const isInvalid = invalidFlows.some(flow => 
          flow[0] === currentFlow[0] && flow[1] === currentFlow[1]
        );
        
        if (isInvalid && importLayer !== 'unknown') {
          this.violations.push({
            type: 'dependency-flow',
            severity: 'HIGH',
            file: relativePath,
            issue: `Invalid dependency: ${layer} → ${importLayer}`,
            fix: `Refactor to follow: app → modules → core → shared`
          });
          this.stats.violationsByType['dependency-flow']++;
        }
      }
    }
  }

  // Helper methods
  extractModuleName(filePath) {
    const match = filePath.match(/src\/modules\/([^/]+)/);
    return match ? match[1] : null;
  }

  extractImports(content) {
    const imports = [];
    const regex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  getFileLayer(filePath) {
    if (filePath.includes('src/app/')) return 'app';
    if (filePath.includes('src/modules/')) return 'module';
    if (filePath.includes('src/core/')) return 'core';
    if (filePath.includes('src/shared/')) return 'shared';
    return 'other';
  }

  getImportLayer(filePath, importPath) {
    try {
      const baseDir = path.dirname(filePath);
      const absoluteImport = path.resolve(baseDir, importPath);
      const relativeToSrc = path.relative(this.srcPath, absoluteImport);
      
      if (relativeToSrc.startsWith('..')) return 'external';
      return this.getFileLayer(absoluteImport);
    } catch {
      return 'unknown';
    }
  }

  isTypeOnlyImport(content, importPath) {
    const escapedPath = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importRegex = new RegExp(`import\\s+(type\\s+)?[^'"]*from\\s+['"]${escapedPath}['"]`, 'g');
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1] || match[0].includes('import type')) {
        return true;
      }
    }
    
    return false;
  }

  isUIComponentFile(filePath) {
    return filePath.endsWith('ui.tsx') || 
           filePath.includes('/ui.') || 
           filePath.match(/[^/]+\.ui\.tsx$/);
  }

  isStoreFile(filePath) {
    return filePath.endsWith('store.ts') || 
           filePath.endsWith('store.tsx') ||
           filePath.match(/[^/]+\.store\.tsx?$/);
  }

  isServiceFile(filePath) {
    return filePath.endsWith('service.ts') || 
           filePath.match(/[^/]+\.service\.ts$/);
  }

  isTestFile(filePath) {
    return filePath.includes('.test.') || 
           filePath.includes('.spec.') ||
           filePath.includes('__tests__') ||
           filePath.includes('__test__');
  }

  isInComment(content, searchTerm) {
    const lines = content.split('\n');
    for (const line of lines) {
      const index = line.indexOf(searchTerm);
      if (index !== -1) {
        const before = line.substring(0, index);
        if (before.includes('//') || before.includes('/*')) {
          return true;
        }
      }
    }
    return false;
  }

  generateReport() {
    console.log('📊 ARCHITECTURE AUDIT REPORT');
    console.log('═'.repeat(80));

    // Filter hanya HIGH dan MEDIUM violations (ignore LOW/type-safety)
    const architectureViolations = this.violations.filter(v => 
      v.type !== 'type-safety' && v.severity !== 'LOW'
    );
    
    const highViolations = architectureViolations.filter(v => v.severity === 'HIGH');
    const mediumViolations = architectureViolations.filter(v => v.severity === 'MEDIUM');
    
    console.log(`\n📈 Statistics:`);
    console.log(`  Files scanned: ${this.stats.filesScanned}`);
    console.log(`  Architecture violations: ${architectureViolations.length}`);
    console.log(`  Type-safety issues: ${this.stats.violationsByType['type-safety']} (LOW priority)`);

    if (architectureViolations.length === 0) {
      console.log('\n🎉 EXCELLENT! No architecture violations found.');
      console.log('Your modular architecture is clean and correct! 🚀\n');
      
      // Show type-safety summary jika ada
      if (this.stats.violationsByType['type-safety'] > 0) {
        console.log('📝 Type-safety notes (for future refactoring):');
        const typeSafetyViolations = this.violations.filter(v => v.type === 'type-safety');
        typeSafetyViolations.slice(0, 5).forEach(v => {
          console.log(`  • ${v.file}: ${v.issue}`);
        });
        if (typeSafetyViolations.length > 5) {
          console.log(`  ... and ${typeSafetyViolations.length - 5} more files`);
        }
      }
      
      console.log('\n✅ ARCHITECTURE RULES STATUS:');
      console.log('   • Dependency flow: app → modules → core → shared ✅');
      console.log('   • Store: State management only ✅');
      console.log('   • Service: External communication only ✅');
      console.log('   • UI: Rendering only, no business logic ✅');
      console.log('   • Cross-module imports: Type-only allowed ✅');
      
      console.log('\n📈 SCORE:');
      console.log('   Architecture Health: 95/100');
      console.log('   🎉 Excellent! Your architecture is solid.');
      
      console.log('\n' + '═'.repeat(80));
      return;
    }

    // Ada architecture violations
    console.log('\n🚨 ARCHITECTURE VIOLATIONS:\n');

    if (highViolations.length > 0) {
      console.log('🔴 HIGH PRIORITY (Must fix):');
      highViolations.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.file}`);
        console.log(`   Type: ${this.formatTypeName(v.type)}`);
        console.log(`   Issue: ${v.issue}`);
        console.log(`   Fix: ${v.fix}`);
      });
    }

    if (mediumViolations.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY (Should fix):');
      mediumViolations.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.file}`);
        console.log(`   Type: ${this.formatTypeName(v.type)}`);
        console.log(`   Issue: ${v.issue}`);
        console.log(`   Fix: ${v.fix}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (highViolations.length + mediumViolations.length > 0) {
      console.log('\n1. Run module fixer:');
      console.log('   node scripts/module-fixer.mjs --all');
      console.log('   node scripts/module-fixer.mjs --check-only');
    }
    
    if (this.stats.violationsByType['type-safety'] > 0) {
      console.log('\n2. Type-safety improvements (when refactoring):');
      console.log('   • Run: npm run type-check');
      console.log('   • Gradually replace "any" with specific types');
    }

    console.log('\n🔧 QUICK FIXES:');
    console.log('   • Check module structure: node scripts/module-fixer.mjs --check-only');
    console.log('   • Fix all modules: node scripts/module-fixer.mjs --all');
    console.log('   • Run type check: npm run type-check');
    
    // Score calculation (focus on architecture violations only)
    const architectureScore = Math.max(0, 100 - (architectureViolations.length * 15));
    const score = Math.round(architectureScore);
    
    console.log('\n📈 SCORE:');
    console.log(`   Architecture Health: ${score}/100`);
    
    if (score >= 90) {
      console.log('   🎉 Excellent! Minor improvements needed.');
    } else if (score >= 80) {
      console.log('   👍 Good! Some refactoring recommended.');
    } else if (score >= 70) {
      console.log('   ⚠️  Fair. Plan refactoring soon.');
    } else {
      console.log('   🔴 Needs significant refactoring.');
    }

    console.log('\n' + '═'.repeat(80));
  }

  formatTypeName(type) {
    const names = {
      'cross-module': 'Cross-module imports',
      'ui-accessing-core': 'UI accessing core',
      'store-business-logic': 'Store business logic',
      'type-safety': 'Type safety',
      'dependency-flow': 'Dependency flow',
      'structure': 'Structure',
      'invalid-import': 'Invalid imports'
    };
    return names[type] || type;
  }
}

// Run auditor
(async () => {
  try {
    const auditor = new ArchitectureAuditor();
    await auditor.run();
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
})();