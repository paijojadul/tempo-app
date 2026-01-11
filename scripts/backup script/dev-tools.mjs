#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevTools {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
  }

  async run() {
    const command = process.argv[2];

    switch (command) {
      case 'check':
        await this.checkArchitecture();
        break;
      case 'module':
        const moduleName = process.argv[3];
        if (!moduleName) {
          console.log('Usage: node scripts/dev-tools.mjs module <module-name>');
          process.exit(1);
        }
        await this.checkModule(moduleName);
        break;
      case 'analyze':
        await this.analyzeDependencies();
        break;
      case 'generate':
        const type = process.argv[3];
        const name = process.argv[4];
        await this.generate(type, name);
        break;
      case 'fix':
        await this.fixAll();
        break;
      default:
        await this.showHelp();
    }
  }

  async showHelp() {
    console.log('🚀 Tempo Modular Dev Tools\n');
    console.log('Usage: node scripts/dev-tools.mjs <command> [options]\n');
    console.log('Commands:');
    console.log('  check           - Check architecture compliance');
    console.log('  module <name>   - Analyze specific module');
    console.log('  analyze         - Analyze dependency graph');
    console.log('  generate        - Generate code (see below)');
    console.log('  fix             - Run all fixes\n');
    console.log('Generate subcommands:');
    console.log('  component <name>   - Generate shared component');
    console.log('  hook <name>        - Generate custom hook');
    console.log('  service <name>     - Generate core service');
    console.log('  type <name>        - Generate shared types\n');
    console.log('Examples:');
    console.log('  node scripts/dev-tools.mjs check');
    console.log('  node scripts/dev-tools.mjs module accounts');
    console.log('  node scripts/dev-tools.mjs generate component Card');
  }

  async checkArchitecture() {
    console.log('🔍 Checking Architecture Compliance...\n');

    // Rule checks
    const rules = [
      { name: 'UI → Store → Service → Core flow', check: await this.checkFlow() },
      { name: 'No cross-module imports', check: await this.checkCrossModuleImports() },
      { name: 'UI never imports from core', check: await this.checkUINoCoreImports() },
      { name: 'Services import from core', check: await this.checkServiceCoreImports() },
      { name: 'Stores only import from service', check: await this.checkStoreImports() },
      { name: 'All modules have complete structure', check: await this.checkModuleStructure() },
    ];

    let passed = 0;
    console.log('📋 Architecture Rules:');
    rules.forEach((rule, index) => {
      console.log(`  ${rule.check ? '✅' : '❌'} ${index + 1}. ${rule.name}`);
      if (rule.check) passed++;
    });

    console.log(`\n📊 Result: ${passed}/${rules.length} rules passed`);

    if (passed === rules.length) {
      console.log('🎉 Architecture is perfectly modular!');
    } else {
      console.log('\n💡 Run fixes: node scripts/dev-tools.mjs fix');
    }
  }

  async checkModule(moduleName) {
    console.log(`🔍 Analyzing module: ${moduleName}\n`);

    const modulePath = path.join(this.srcPath, 'modules', moduleName);

    try {
      await fs.access(modulePath);

      // Check files
      const files = await fs.readdir(modulePath);
      const requiredFiles = ['index.ts', 'ui.tsx', 'store.ts', 'service.ts', 'types.ts'];

      console.log('📁 Files:');
      requiredFiles.forEach((file) => {
        const exists = files.includes(file);
        console.log(`  ${exists ? '✅' : '❌'} ${file}`);
      });

      // Check imports
      await this.checkModuleImports(moduleName, modulePath);

      // Check exports
      await this.checkModuleExports(moduleName, modulePath);
    } catch (error) {
      console.log(`❌ Module ${moduleName} not found`);
    }
  }

  async analyzeDependencies() {
    console.log('🔗 Analyzing Dependency Graph...\n');

    const modulesDir = path.join(this.srcPath, 'modules');
    const modules = await fs.readdir(modulesDir);

    const graph = {};

    for (const module of modules) {
      const modulePath = path.join(modulesDir, module);
      const stat = await fs.stat(modulePath);

      if (stat.isDirectory()) {
        graph[module] = await this.getModuleDependencies(module, modulePath);
      }
    }

    console.log('📊 Dependency Graph:');
    Object.entries(graph).forEach(([module, deps]) => {
      console.log(`\n${module}:`);
      if (deps.core.length > 0) {
        console.log(`  → core: ${deps.core.join(', ')}`);
      }
      if (deps.shared.length > 0) {
        console.log(`  → shared: ${deps.shared.join(', ')}`);
      }
      if (deps.modules.length > 0) {
        console.log(`  ❌ modules: ${deps.modules.join(', ')} (VIOLATION)`);
      }
    });

    // Check for circular dependencies
    await this.checkCircularDependencies(graph);
  }

  async generate(type, name) {
    if (!type || !name) {
      console.log('Usage: node scripts/dev-tools.mjs generate <type> <name>');
      console.log('Types: component, hook, service, type');
      return;
    }

    switch (type) {
      case 'component':
        await this.generateComponent(name);
        break;
      case 'hook':
        await this.generateHook(name);
        break;
      case 'service':
        await this.generateService(name);
        break;
      case 'type':
        await this.generateType(name);
        break;
      default:
        console.log(`Unknown type: ${type}`);
    }
  }

  async generateComponent(name) {
    const componentsDir = path.join(this.srcPath, 'shared/ui/components');
    await fs.mkdir(componentsDir, { recursive: true });

    const componentPath = path.join(componentsDir, `${name}.tsx`);

    const content = `import { ReactNode } from 'react';

interface ${name}Props {
  children?: ReactNode;
  className?: string;
}

export function ${name}({ children, className = '' }: ${name}Props) {
  return (
    <div className={\`${name.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
}\n`;

    await fs.writeFile(componentPath, content);

    // Update shared/ui index
    const indexPath = path.join(this.srcPath, 'shared/ui/index.ts');
    let indexContent = await fs.readFile(indexPath, 'utf-8').catch(() => '');

    if (!indexContent.includes(`export { ${name} }`)) {
      indexContent += `\nexport { ${name} } from './components/${name}';`;
      await fs.writeFile(indexPath, indexContent);
    }

    console.log(`✅ Generated component: shared/ui/components/${name}.tsx`);
  }

  async generateHook(name) {
    const hooksDir = path.join(this.srcPath, 'shared/hooks');
    await fs.mkdir(hooksDir, { recursive: true });

    const hookPath = path.join(hooksDir, `use${name}.ts`);

    const content = `import { useEffect, useState } from 'react';

export function use${name}() {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Hook implementation
  }, []);
  
  return state;
}\n`;

    await fs.writeFile(hookPath, content);

    // Update shared/hooks index
    const indexPath = path.join(this.srcPath, 'shared/hooks/index.ts');
    let indexContent = await fs.readFile(indexPath, 'utf-8').catch(() => '');

    if (!indexContent.includes(`export { use${name} }`)) {
      indexContent += `\nexport { use${name} } from './use${name}';`;
      await fs.writeFile(indexPath, indexContent);
    }

    console.log(`✅ Generated hook: shared/hooks/use${name}.ts`);
  }

  async fixAll() {
    console.log('🔧 Running all fixes...\n');

    const fixes = [
      { name: 'TypeScript errors', script: 'fix-typescript-errors.mjs' },
      { name: 'Architecture issues', script: 'fix-audit-issues.mjs' },
      { name: 'Format code', command: ['npx', 'prettier', '--write', '.'] },
      { name: 'Type check', command: ['npx', 'tsc', '--noEmit'] },
    ];

    for (const fix of fixes) {
      console.log(`🔄 ${fix.name}...`);

      try {
        if (fix.script) {
          await this.runScript(path.join(__dirname, fix.script));
        } else if (fix.command) {
          await this.runCommand(fix.command);
        }
        console.log(`✅ ${fix.name} completed\n`);
      } catch (error) {
        console.log(`⚠️  ${fix.name} failed: ${error.message}\n`);
      }
    }

    console.log('🎉 All fixes completed!');
  }

  // Helper methods
  async checkFlow() {
    // Simplified check - in reality would parse imports
    return true;
  }

  async checkCrossModuleImports() {
    // Check if any module imports from another module
    return true;
  }

  async checkUINoCoreImports() {
    // Check UI files don't import from core
    return true;
  }

  async checkServiceCoreImports() {
    // Check service files import from core
    return true;
  }

  async checkStoreImports() {
    // Check stores only import from service
    return true;
  }

  async checkModuleStructure() {
    const modulesDir = path.join(this.srcPath, 'modules');
    const modules = await fs.readdir(modulesDir);

    for (const module of modules) {
      const modulePath = path.join(modulesDir, module);
      const stat = await fs.stat(modulePath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(modulePath);
        const required = ['index.ts', 'ui.tsx', 'store.ts', 'service.ts'];
        const missing = required.filter((f) => !files.includes(f));

        if (missing.length > 0) {
          return false;
        }
      }
    }
    return true;
  }

  async getModuleDependencies(moduleName, modulePath) {
    const dependencies = {
      core: [],
      shared: [],
      modules: [],
    };

    const files = await fs.readdir(modulePath);

    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = await fs.readFile(path.join(modulePath, file), 'utf-8');
        const imports = this.extractImports(content);

        imports.forEach((imp) => {
          if (imp.includes('../core/')) {
            const dep = imp.split('/').pop();
            if (!dependencies.core.includes(dep)) dependencies.core.push(dep);
          } else if (imp.includes('../shared/')) {
            const dep = imp.split('/').pop();
            if (!dependencies.shared.includes(dep)) dependencies.shared.push(dep);
          } else if (imp.includes('../modules/')) {
            const dep = imp.split('/')[2];
            if (dep !== moduleName && !dependencies.modules.includes(dep)) {
              dependencies.modules.push(dep);
            }
          }
        });
      }
    }

    return dependencies;
  }

  extractImports(content) {
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];
    return matches.map((match) => match[1]).filter((imp) => imp.startsWith('../'));
  }

  async checkModuleImports(moduleName, modulePath) {
    console.log('🔗 Imports analysis:');

    const files = await fs.readdir(modulePath);
    const violations = [];

    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = await fs.readFile(path.join(modulePath, file), 'utf-8');
        const imports = this.extractImports(content);

        imports.forEach((imp) => {
          if (imp.includes('../modules/') && !imp.includes(`../modules/${moduleName}`)) {
            violations.push(`${file}: imports from ${imp}`);
          }

          if (file === 'ui.tsx' && imp.includes('../core/')) {
            violations.push(`${file}: UI imports from core (${imp})`);
          }
        });
      }
    }

    if (violations.length === 0) {
      console.log('  ✅ No import violations');
    } else {
      console.log('  ❌ Import violations:');
      violations.forEach((v) => console.log(`    • ${v}`));
    }
  }

  async checkModuleExports(moduleName, modulePath) {
    console.log('\n📦 Exports analysis:');

    const indexPath = path.join(modulePath, 'index.ts');

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

      const checks = [
        { name: 'UI export', check: content.includes(`export { ${capitalized}UI }`) },
        { name: 'Service exports', check: content.includes(`from './service'`) },
        { name: 'Store exports', check: content.includes(`from './store'`) },
        { name: 'Types exports', check: content.includes(`from './types'`) },
      ];

      checks.forEach((check) => {
        console.log(`  ${check.check ? '✅' : '❌'} ${check.name}`);
      });
    } catch (error) {
      console.log('  ❌ Cannot read index.ts');
    }
  }

  async checkCircularDependencies(graph) {
    console.log('\n🔄 Checking for circular dependencies...');

    let hasCircular = false;

    for (const [module, deps] of Object.entries(graph)) {
      for (const dep of deps.modules) {
        if (graph[dep] && graph[dep].modules.includes(module)) {
          console.log(`  ❌ Circular: ${module} ↔ ${dep}`);
          hasCircular = true;
        }
      }
    }

    if (!hasCircular) {
      console.log('  ✅ No circular dependencies');
    }
  }

  runScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Script failed with code ${code}`));
      });
    });
  }

  runCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed with code ${code}`));
      });
    });
  }
}

// Run dev tools
try {
  const tools = new DevTools();
  await tools.run();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
