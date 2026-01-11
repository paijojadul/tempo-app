#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ModuleCreator {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  async run() {
    const args = process.argv.slice(2);
    const moduleName = args[0];

    if (!moduleName) {
      console.log('❌ Usage: node scripts/create-module.mjs <module-name>');
      console.log('Example: node scripts/create-module.mjs accounts');
      console.log('Example: node scripts/create-module.mjs transactions');
      process.exit(1);
    }

    // Validate module name
    if (!/^[a-z][a-z0-9]*$/.test(moduleName)) {
      console.log('❌ Module name must be lowercase and alphanumeric');
      console.log('❌ Example: "accounts", not "Accounts" or "my-module"');
      process.exit(1);
    }

    console.log(`🚀 Creating new module: ${moduleName}\n`);
    await this.createModuleStructure(moduleName);
  }

  async createModuleStructure(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);

    // Check if module exists
    try {
      await fs.access(modulePath);
      console.log(`❌ Module "${moduleName}" already exists!`);
      process.exit(1);
    } catch {
      // Continue
    }

    // Create module directory
    await fs.mkdir(modulePath, { recursive: true });
    console.log(`📁 Created: modules/${moduleName}`);

    // Create files
    const files = {
      'index.ts': this.generateIndexFile(moduleName),
      'types.ts': this.generateTypesFile(moduleName),
      'service.ts': this.generateServiceFile(moduleName),
      'store.ts': this.generateStoreFile(moduleName),
      'ui.tsx': this.generateUIFile(moduleName),
    };

    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(modulePath, fileName);
      await fs.writeFile(filePath, content);
      console.log(`  ✅ Created: ${fileName}`);
    }

    console.log(`\n✅ Module "${moduleName}" created successfully!`);
    console.log(`📁 Location: src/modules/${moduleName}`);
    console.log('\n💡 Next steps:');
    console.log(
      `  1. Add to App.tsx: import { ${this.capitalize(moduleName)}UI } from './modules/${moduleName}'`
    );
    console.log(`  2. Run: node scripts/dev-tools-ultimate.mjs check`);
    console.log(`  3. Start implementing service logic`);
  }

  // ... (rest of the methods remain the same - generateIndexFile, generateTypesFile, etc.)

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run creator
try {
  const creator = new ModuleCreator();
  await creator.run();
} catch (error) {
  console.error('❌ Error creating module:', error.message);
  process.exit(1);
}
