#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TSConfigUpdater {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async run() {
    console.log('⚙️  Updating tsconfig.json for modular development...\n');

    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8');
      const config = JSON.parse(content);

      // Update compilerOptions
      config.compilerOptions = {
        ...config.compilerOptions,
        // Keep strict but allow unused for development
        noUnusedLocals: false,
        noUnusedParameters: false,
        // Add path aliases for modular imports
        baseUrl: '.',
        paths: {
          '@/*': ['src/*'],
          '@core/*': ['src/core/*'],
          '@modules/*': ['src/modules/*'],
          '@shared/*': ['src/shared/*'],
          '@app/*': ['src/app/*'],
        },
        // Better module resolution
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      };

      // Ensure include array
      config.include = config.include || ['src'];

      await fs.writeFile(tsconfigPath, JSON.stringify(config, null, 2));
      console.log('✅ Updated tsconfig.json with:');
      console.log('   • Disabled noUnusedLocals/noUnusedParameters');
      console.log('   • Added path aliases (@/, @core/, @modules/, etc.)');
      console.log('   • Improved module resolution');
    } catch (error) {
      console.log(`❌ Cannot update tsconfig.json: ${error.message}`);
    }
  }
}

// Run updater
try {
  const updater = new TSConfigUpdater();
  await updater.run();
} catch (error) {
  console.error('❌ Error updating tsconfig:', error.message);
  process.exit(1);
}
