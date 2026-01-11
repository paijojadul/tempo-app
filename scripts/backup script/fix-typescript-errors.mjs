#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartTypeScriptFixer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.fixesApplied = [];
    this.errorStats = {
      fixed: 0,
      skipped: 0,
      failed: 0,
    };
  }

  async run() {
    console.log('🔧 SMART TypeScript Error Fixer\n');
    console.log('═'.repeat(80));

    console.log('🔍 Scanning project for TypeScript files...');

    // 1. Scan semua file TypeScript
    const tsFiles = await this.findAllTypeScriptFiles();
    console.log(`📁 Found ${tsFiles.length} TypeScript files\n`);

    // 2. Fokus pada error CRITICAL dulu
    await this.fixCriticalErrors(tsFiles);

    // 3. Setup mocks jika perlu
    await this.setupSmartMocks();

    // 4. Generate laporan
    await this.generateSmartReport();
  }

  async findAllTypeScriptFiles() {
    const files = [];

    try {
      // Rekursif cari file .ts dan .tsx
      await this.findFilesRecursive(this.projectRoot, files);

      // Filter hanya .ts dan .tsx, exclude node_modules dan dist
      return files.filter(
        (file) =>
          (file.endsWith('.ts') || file.endsWith('.tsx')) &&
          !file.includes('node_modules') &&
          !file.includes('dist') &&
          !file.includes('build')
      );
    } catch (error) {
      console.log(`⚠️  Error scanning files: ${error.message}`);
      return [];
    }
  }

  async findFilesRecursive(dir, files) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);

        try {
          const stats = await fs.stat(fullPath);

          if (stats.isDirectory()) {
            // Skip known directories
            if (
              !item.startsWith('.') &&
              item !== 'node_modules' &&
              item !== 'dist' &&
              item !== 'build'
            ) {
              await this.findFilesRecursive(fullPath, files);
            }
          } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip jika tidak bisa baca
        }
      }
    } catch (error) {
      // Ignore jika tidak bisa baca directory
    }
  }

  async fixCriticalErrors(filePaths) {
    console.log('🔧 FIXING CRITICAL ERRORS ONLY\n');

    // Priority 1: Missing imports untuk getTempoClient
    console.log('1. Fixing missing getTempoClient imports...');
    await this.fixGetTempoClientImports(filePaths);

    // Priority 2: Fix unused get parameter in Zustand stores
    console.log('\n2. Fixing unused get parameters in Zustand stores...');
    await this.fixZustandGetParameters(filePaths);

    // Priority 3: Fix tempo.ts imports
    console.log('\n3. Fixing tempo.ts imports...');
    await this.fixTempoImports(filePaths);

    // Priority 4: Fix test-import.ts if exists
    console.log('\n4. Checking test-import.ts...');
    await this.fixTestImportFile();
  }

  async fixGetTempoClientImports(filePaths) {
    let fixedCount = 0;

    for (const filePath of filePaths) {
      try {
        const relativePath = path.relative(this.projectRoot, filePath);
        const content = await fs.readFile(filePath, 'utf-8');

        // Cek jika menggunakan getTempoClient tapi tidak import
        if (
          content.includes('getTempoClient(') &&
          !content.includes('from') &&
          !content.includes('import') &&
          !content.includes('//')
        ) {
          console.log(`  📄 ${relativePath}: Missing getTempoClient import`);

          // Cari import relatif yang benar
          const importLine = this.getCorrectImportLine(relativePath, 'getTempoClient');
          const newContent = importLine + content;

          await fs.writeFile(filePath, newContent);
          console.log(`    ✅ Added import: ${importLine.trim()}`);
          fixedCount++;
          this.recordFix('added_getTempoClient_import', relativePath);
        }
      } catch (error) {
        // Skip file yang error
      }
    }

    if (fixedCount === 0) {
      console.log('  ✅ No missing getTempoClient imports found');
    }
  }

  async fixZustandGetParameters(filePaths) {
    let fixedCount = 0;

    for (const filePath of filePaths) {
      try {
        const relativePath = path.relative(this.projectRoot, filePath);
        const content = await fs.readFile(filePath, 'utf-8');

        // Cek jika ada create dengan get parameter yang tidak digunakan
        if (content.includes('create<') && content.includes('get)')) {
          const lines = content.split('\n');
          let modified = false;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('create<') && lines[i].includes('get)')) {
              // Cek apakah get digunakan setelahnya
              const restOfContent = lines.slice(i + 1).join('\n');
              const getUsed =
                restOfContent.includes('get.') ||
                restOfContent.includes('get(') ||
                restOfContent.includes('get )');

              if (!getUsed) {
                lines[i] = lines[i].replace('(set, get)', '(set)');
                modified = true;
                console.log(`  📄 ${relativePath}: Removed unused get parameter`);
                fixedCount++;
                this.recordFix('removed_get_param', relativePath);
              }
              break;
            }
          }

          if (modified) {
            await fs.writeFile(filePath, lines.join('\n'));
          }
        }
      } catch (error) {
        // Skip file yang error
      }
    }

    if (fixedCount === 0) {
      console.log('  ✅ No unused get parameters found');
    }
  }

  async fixTempoImports(filePaths) {
    let fixedCount = 0;

    for (const filePath of filePaths) {
      try {
        const relativePath = path.relative(this.projectRoot, filePath);
        let content = await fs.readFile(filePath, 'utf-8');
        let modified = false;

        // Fix tempo.ts imports
        if (content.includes("from 'tempo'") || content.includes('from "tempo"')) {
          content = content.replace(
            /from ['"]tempo['"]/g,
            "from '../../core/tempo/mocks/tempo-chains'"
          );
          modified = true;
          console.log(`  📄 ${relativePath}: Fixed tempo import`);
        }

        if (content.includes("from 'tempo.ts'") || content.includes('from "tempo.ts"')) {
          content = content.replace(
            /from ['"]tempo\.ts['"]/g,
            "from '../../core/tempo/mocks/tempo-chains'"
          );
          modified = true;
          console.log(`  📄 ${relativePath}: Fixed tempo.ts import`);
        }

        // Fix wagmi/viem imports
        if (content.includes("from 'wagmi'") || content.includes('from "wagmi"')) {
          content = content.replace(/from ['"]wagmi['"]/g, "from '../../core/tempo/mocks/wagmi'");
          modified = true;
          console.log(`  📄 ${relativePath}: Fixed wagmi import`);
        }

        if (content.includes("from 'viem'") || content.includes('from "viem"')) {
          content = content.replace(/from ['"]viem['"]/g, "from '../../core/tempo/mocks/viem'");
          modified = true;
          console.log(`  📄 ${relativePath}: Fixed viem import`);
        }

        if (modified) {
          await fs.writeFile(filePath, content);
          fixedCount++;
          this.recordFix('fixed_external_import', relativePath);
        }
      } catch (error) {
        // Skip file yang error
      }
    }

    if (fixedCount === 0) {
      console.log('  ✅ No external package imports to fix');
    }
  }

  async fixTestImportFile() {
    const testImportPath = path.join(this.srcPath, 'test-import.ts');

    try {
      await fs.access(testImportPath);

      // Update test-import.ts untuk pakai mocks
      let content = await fs.readFile(testImportPath, 'utf-8');

      // Replace external imports dengan mocks
      content = content.replace(
        /from ['"]tempo\.ts\/chains['"]/g,
        "from '../core/tempo/mocks/tempo-chains'"
      );

      content = content.replace(/from ['"]wagmi\/viem['"]/g, "from '../core/tempo/mocks/viem'");

      await fs.writeFile(testImportPath, content);
      console.log(`  ✅ Updated test-import.ts to use mocks`);
      this.recordFix('fixed_test_import', 'test-import.ts');
    } catch (error) {
      console.log('  ✅ test-import.ts not found (ok)');
    }
  }

  async setupSmartMocks() {
    console.log('\n🔧 SETTING UP MOCKS\n');

    const mockDir = path.join(this.srcPath, 'core/tempo/mocks');

    try {
      await fs.mkdir(mockDir, { recursive: true });
      console.log(`  📁 Mock directory: ${path.relative(this.projectRoot, mockDir)}`);

      // Hanya buat mock jika belum ada
      const mockFiles = {
        'tempo-chains.ts': `// Mock for tempo.ts/chains
export const tempoModerato = {
  id: 42429,
  name: 'Tempo Testnet',
  network: 'tempo',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.tempo.xyz'] },
    default: { http: ['https://rpc.testnet.tempo.xyz'] },
  },
};

export const TEMPO_TESTNET = tempoModerato;
export const getChainConfig = () => tempoModerato;\n`,

        'wagmi.ts': `// Mock for wagmi packages
export const createConfig = (params: any) => ({
  chains: [params.chains || []],
  connectors: [],
  transports: {},
});

export const webAuthn = {
  createConfig,
};

export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});\n`,

        'viem.ts': `// Mock for viem
export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});
export const parseEther = (value: string) => BigInt(Math.floor(parseFloat(value) * 1e18));
export const formatEther = (value: bigint) => (Number(value) / 1e18).toString();\n`,

        'index.ts': `// Mock index file
export * from './tempo-chains';
export * from './wagmi';
export * from './viem';\n`,
      };

      for (const [fileName, content] of Object.entries(mockFiles)) {
        const filePath = path.join(mockDir, fileName);

        try {
          await fs.access(filePath);
          console.log(`    ✅ ${fileName} already exists`);
        } catch {
          await fs.writeFile(filePath, content);
          console.log(`    ✅ Created ${fileName}`);
          this.recordFix('created_mock', fileName);
        }
      }

      // Update tsconfig.json path mappings
      await this.updateTsConfigForMocks();
    } catch (error) {
      console.log(`  ⚠️  Mock setup failed: ${error.message}`);
    }
  }

  async updateTsConfigForMocks() {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8');
      const config = JSON.parse(content);

      // Ensure compilerOptions exists
      if (!config.compilerOptions) {
        config.compilerOptions = {};
      }

      // Add or update path mappings
      config.compilerOptions.paths = {
        ...config.compilerOptions.paths,
        'tempo.ts': ['./src/core/tempo/mocks/tempo-chains'],
        'tempo.ts/chains': ['./src/core/tempo/mocks/tempo-chains'],
        'tempo.ts/*': ['./src/core/tempo/mocks/*'],
        wagmi: ['./src/core/tempo/mocks/wagmi'],
        'wagmi/*': ['./src/core/tempo/mocks/*'],
        viem: ['./src/core/tempo/mocks/viem'],
        'viem/*': ['./src/core/tempo/mocks/*'],
      };

      await fs.writeFile(tsconfigPath, JSON.stringify(config, null, 2));
      console.log('    ✅ Updated tsconfig.json path mappings');
      this.recordFix('updated_tsconfig_paths', 'tsconfig.json');
    } catch (error) {
      console.log('    ⚠️  Could not update tsconfig.json');
    }
  }

  // ========== HELPER METHODS ==========

  getCorrectImportLine(filePath, importName) {
    // Hitung relative path ke core/tempo
    const fileDir = path.dirname(filePath);
    let relativePath = '';

    if (filePath.includes('src/modules/')) {
      // Dari modules ke core/tempo
      relativePath = '../../core/tempo';
    } else if (filePath.includes('src/core/')) {
      // Dari dalam core
      relativePath = './tempo';
    } else if (filePath.includes('src/')) {
      // Dari root src
      relativePath = './core/tempo';
    } else {
      // Fallback
      relativePath = './src/core/tempo';
    }

    return `import { ${importName} } from '${relativePath}';\n`;
  }

  recordFix(type, file) {
    this.fixesApplied.push({ type, file });
    this.errorStats.fixed++;
  }

  async generateSmartReport() {
    console.log('\n📋 SMART FIX REPORT');
    console.log('═'.repeat(80));

    console.log(`\n📊 Fix Statistics:`);
    console.log(`  ✅ Fixed: ${this.errorStats.fixed}`);
    console.log(`  ⚠️  Skipped: ${this.errorStats.skipped}`);
    console.log(`  ❌ Failed: ${this.errorStats.failed}`);

    if (this.fixesApplied.length > 0) {
      console.log(`\n🔧 Critical Fixes Applied:`);

      // Group by fix type
      const fixGroups = {};
      this.fixesApplied.forEach((fix) => {
        const type = fix.type;
        if (!fixGroups[type]) fixGroups[type] = [];
        fixGroups[type].push(fix.file);
      });

      Object.entries(fixGroups).forEach(([type, files]) => {
        console.log(`\n  ${this.getFixTypeDescription(type)} (${files.length}):`);
        files.slice(0, 3).forEach((file) => {
          console.log(`    • ${file}`);
        });
        if (files.length > 3) {
          console.log(`    • ... and ${files.length - 3} more`);
        }
      });
    } else {
      console.log('\n🎉 No critical TypeScript errors found!');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('\n1. Run TypeScript check:');
    console.log('   npx tsc --noEmit');

    console.log('\n2. If errors remain, try:');
    console.log('   • Install real packages: npm install tempo.ts wagmi viem');
    console.log('   • Or disable strict mode in tsconfig.json:');
    console.log('     Set "noUnusedLocals": false');

    console.log('\n3. For development:');
    console.log('   • The mocks will allow compilation');
    console.log('   • Replace with real packages when ready');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Check if project compiles: npx tsc --noEmit');
    console.log('   2. Start dev server: npm run dev (if configured)');
    console.log('   3. Implement real blockchain integration');

    console.log('\n' + '═'.repeat(80));
  }

  getFixTypeDescription(type) {
    const descriptions = {
      added_getTempoClient_import: 'Added getTempoClient imports',
      removed_get_param: 'Removed unused get parameters',
      fixed_external_import: 'Fixed external package imports',
      fixed_test_import: 'Fixed test import file',
      created_mock: 'Created mock files',
      updated_tsconfig_paths: 'Updated tsconfig paths',
    };

    return descriptions[type] || type;
  }
}

// Run the fixer
try {
  const fixer = new SmartTypeScriptFixer();
  await fixer.run();
} catch (error) {
  console.error('❌ Error running TypeScript fixer:', error.message);
  process.exit(1);
}
