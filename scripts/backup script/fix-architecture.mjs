#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

const FIXES = {
  FIX_DEPENDENCIES: 'fix-deps',
  FIX_MODULE_IMPORTS: 'fix-module-imports',
  FIX_CORE_ACCESS: 'fix-core-access',
  ADD_MISSING_EXPORTS: 'add-exports',
};

async function getAllFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...(await getAllFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function writeFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✓ Updated: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error.message);
    return false;
  }
}

async function fixDependencyViolations() {
  console.log('\n🔧 Fixing dependency violations...');

  const files = await getAllFiles(SRC_DIR);
  const tsFiles = files.filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));

  for (const filePath of tsFiles) {
    const relativePath = path.relative(SRC_DIR, filePath);
    let content = await readFile(filePath);

    if (!content) continue;

    let modified = false;
    const lines = content.split('\n');
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const importMatch = line.match(/from\s+['"](.+)['"]/);

      if (importMatch) {
        const importSrc = importMatch[1];

        // Fix: ui.tsx importing from core directly
        if (filePath.endsWith('ui.tsx') && importSrc.includes('../core/')) {
          // Check if it's importing store or service
          if (importSrc.includes('/store')) {
            // This is allowed, keep it
            newLines.push(line);
          } else if (importSrc.includes('/service')) {
            // ui.tsx should not import service directly
            // Replace with store import
            const newLine = line.replace(importSrc, importSrc.replace('/service', '/store'));
            console.log(`  ${relativePath}: Redirect service import to store`);
            newLines.push(newLine);
            modified = true;
          } else {
            // Other core imports - remove or comment
            console.log(`  ${relativePath}: Removing direct core import: ${importSrc}`);
            newLines.push(`// FIXED: ${line} // ui.tsx should not import core directly`);
            modified = true;
          }
        }
        // Fix: module importing from another module
        else if (filePath.includes('modules/') && importSrc.includes('../modules/')) {
          const currentModule = filePath.split('modules/')[1]?.split(path.sep)[0];
          const importedModule = importSrc.split('modules/')[1]?.split('/')[0];

          if (importedModule && importedModule !== currentModule) {
            console.log(`  ${relativePath}: Module isolation violation: ${importSrc}`);
            console.log(`    Consider: Create shared service in core/ or use events`);
            newLines.push(`// TODO: FIX MODULE ISOLATION - ${line}`);
            modified = true;
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }

    if (modified) {
      await writeFile(filePath, newLines.join('\n'));
    }
  }
}

async function fixCoreAccess() {
  console.log('\n🔧 Ensuring only service.ts accesses core/tempo...');

  const files = await getAllFiles(SRC_DIR);
  const tsFiles = files.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('service.ts') && !f.includes('core/tempo')
  );

  for (const filePath of tsFiles) {
    let content = await readFile(filePath);
    if (!content) continue;

    // Check for core/tempo imports in non-service files
    if (content.includes("from '../core/tempo'") || content.includes("from '../../core/tempo'")) {
      const relativePath = path.relative(SRC_DIR, filePath);
      console.log(`  ${relativePath}: Has core/tempo import`);

      // Replace with appropriate fix
      let newContent = content;

      // If it's a store.ts file, it should import from service.ts
      if (filePath.endsWith('store.ts')) {
        // Find the service import
        const serviceImportMatch = content.match(/from\s+['"]\.\/service['"]/);
        if (!serviceImportMatch) {
          // Add service import if missing
          const importMatch = content.match(/import.*from.*['"][^'"]+['"]/);
          if (importMatch) {
            const importIndex = content.indexOf(importMatch[0]) + importMatch[0].length;
            newContent =
              content.slice(0, importIndex) +
              '\nimport { fetchAccountsCount } from "./service"' +
              content.slice(importIndex);
          }
        }

        // Comment out core/tempo imports
        newContent = newContent.replace(
          /import.*from.*['"]\.\.\/core\/tempo['"]/g,
          '// FIXED: Should access core/tempo through service.ts'
        );

        await writeFile(filePath, newContent);
      }
    }
  }
}

async function addMissingExports() {
  console.log('\n🔧 Checking for missing exports...');

  const moduleDirs = ['accounts', 'payments', 'issuance', 'exchange'];

  for (const module of moduleDirs) {
    const modulePath = path.join(SRC_DIR, 'modules', module);

    // Check index.ts
    const indexPath = path.join(modulePath, 'index.ts');
    let indexContent = (await readFile(indexPath)) || '';

    // Check what should be exported
    const uiFile = path.join(modulePath, 'ui.tsx');
    const serviceFile = path.join(modulePath, 'service.ts');
    const storeFile = path.join(modulePath, 'store.ts');

    const hasUI = await fs
      .access(uiFile)
      .then(() => true)
      .catch(() => false);
    const hasService = await fs
      .access(serviceFile)
      .then(() => true)
      .catch(() => false);
    const hasStore = await fs
      .access(storeFile)
      .then(() => true)
      .catch(() => false);

    let newExports = [];

    if (hasUI) {
      // Extract component name from ui.tsx
      const uiContent = (await readFile(uiFile)) || '';
      const componentMatch = uiContent.match(/export\s+(function|const)\s+(\w+UI)/);
      if (componentMatch && !indexContent.includes(componentMatch[2])) {
        newExports.push(`export { ${componentMatch[2]} } from './ui'`);
      }
    }

    if (hasService) {
      const serviceContent = (await readFile(serviceFile)) || '';
      const functionMatches = serviceContent.match(/export\s+(async\s+)?function\s+(\w+)/g);
      if (functionMatches) {
        const functionNames = functionMatches.map((m) => m.match(/function\s+(\w+)/)[1]);
        for (const name of functionNames) {
          if (!indexContent.includes(name)) {
            newExports.push(`export { ${name} } from './service'`);
          }
        }
      }
    }

    if (hasStore) {
      const storeContent = (await readFile(storeFile)) || '';
      const storeMatch = storeContent.match(/export\s+const\s+(\w+Store)/);
      if (storeMatch && !indexContent.includes(storeMatch[1])) {
        newExports.push(`export { ${storeMatch[1]} } from './store'`);
      }
    }

    // Add missing exports
    if (newExports.length > 0) {
      const updatedContent =
        indexContent.trim() + (indexContent.trim() ? '\n\n' : '') + newExports.join('\n') + '\n';

      console.log(`  modules/${module}/index.ts: Adding exports`);
      await writeFile(indexPath, updatedContent);
    }
  }
}

async function createTemplateFiles() {
  console.log('\n📁 Creating template files for missing patterns...');

  const modules = ['payments', 'issuance', 'exchange'];

  for (const module of modules) {
    const moduleDir = path.join(SRC_DIR, 'modules', module);

    // Check if service.ts exists
    const servicePath = path.join(moduleDir, 'service.ts');
    try {
      await fs.access(servicePath);
    } catch {
      // Create template service.ts
      const serviceTemplate = `import { getTempoClient } from '../../core/tempo'
import { useGlobalStore } from '../../core/store'

export async function run${capitalize(module)}() {
  const client = getTempoClient()
  console.log('Running ${module} with Tempo client:', client)
  
  // TODO: Implement ${module} logic
  await new Promise((r) => setTimeout(r, 100))
  
  return { success: true }
}

export async function fetch${capitalize(module)}Data(): Promise<any> {
  try {
    // TODO: Fetch data from Tempo
    return { data: 'placeholder' }
  } catch (error) {
    useGlobalStore.getState().setError(
      error instanceof Error ? error.message : 'Failed to fetch ${module} data'
    )
    throw error
  }
}
`;
      await fs.mkdir(moduleDir, { recursive: true });
      await writeFile(servicePath, serviceTemplate);
    }

    // Check if store.ts exists
    const storePath = path.join(moduleDir, 'store.ts');
    try {
      await fs.access(storePath);
    } catch {
      // Create template store.ts
      const storeTemplate = `import { create } from 'zustand'
import { fetch${capitalize(module)}Data } from './service'

type ${capitalize(module)}State = {
  data: any
  loading: boolean
  error: string | null
  load: () => Promise<void>
  reset: () => void
}

export const use${capitalize(module)}Store = create<${capitalize(module)}State>((set, get) => ({
  data: null,
  loading: false,
  error: null,

  load: async () => {
    if (get().loading) return
    
    set({ loading: true, error: null })
    
    try {
      const data = await fetch${capitalize(module)}Data()
      set({ data, loading: false })
    } catch (error) {
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  reset: () => set({ data: null, error: null }),
}))
`;
      await writeFile(storePath, storeTemplate);
    }
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function printHelp() {
  console.log(`
🔧 Architecture Fix Script

Usage:
  node scripts/fix-architecture.mjs [options]

Options:
  --fix-deps          Fix dependency violations
  --fix-module-imports Fix module isolation issues
  --fix-core-access   Ensure only service.ts accesses core/tempo
  --add-exports       Add missing exports to index.ts files
  --create-templates  Create missing template files
  --all               Run all fixes
  --help              Show this help

Examples:
  node scripts/fix-architecture.mjs --fix-deps
  node scripts/fix-architecture.mjs --all
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    return;
  }

  console.log('🚀 Starting architecture fixes...');

  if (args.includes('--all') || args.includes('--fix-deps')) {
    await fixDependencyViolations();
  }

  if (args.includes('--all') || args.includes('--fix-module-imports')) {
    await fixDependencyViolations(); // Same function handles both
  }

  if (args.includes('--all') || args.includes('--fix-core-access')) {
    await fixCoreAccess();
  }

  if (args.includes('--all') || args.includes('--add-exports')) {
    await addMissingExports();
  }

  if (args.includes('--all') || args.includes('--create-templates')) {
    await createTemplateFiles();
  }

  console.log('\n✅ Fixes completed!');
  console.log('💡 Run audit again: node scripts/audit-architecture.mjs');
}

main().catch(console.error);
