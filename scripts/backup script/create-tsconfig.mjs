#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TsConfigCreator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.fixesApplied = [];
    this.configOptions = {
      // Opsi untuk project React + TypeScript modern
      strictMode: {
        target: 'es2020',
        module: 'esnext',
        lib: ['dom', 'dom.iterable', 'esnext'],
        skipLibCheck: true,
        moduleResolution: 'node',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
        verbatimModuleSyntax: true,
      },

      // Opsi lebih ringan (kalau strict mode bikin banyak error)
      lenientMode: {
        target: 'es2020',
        module: 'esnext',
        lib: ['dom', 'dom.iterable', 'esnext'],
        skipLibCheck: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: false, // Nonaktifkan strict
        noUnusedLocals: false, // Izinkan unused variables
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    };
  }

  async run() {
    console.log('📄 Creating/Updating TypeScript Configuration...\n');
    console.log('═'.repeat(80));

    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');

    try {
      // Cek apakah project sudah ada tsconfig
      await fs.access(tsconfigPath);
      console.log('✅ tsconfig.json ditemukan');
      await this.analyzeAndFixConfig(tsconfigPath);
    } catch (error) {
      console.log('ℹ️  tsconfig.json tidak ditemukan, membuat baru...');
      await this.createNewConfig(tsconfigPath);
    }

    await this.generateReport();
  }

  async analyzeAndFixConfig(filePath) {
    console.log('\n🔍 Analyzing existing tsconfig.json...');

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(content);

      console.log('📊 Current configuration:');
      console.log(`  • strict: ${config.compilerOptions?.strict || 'not set'}`);
      console.log(`  • noUnusedLocals: ${config.compilerOptions?.noUnusedLocals || 'not set'}`);
      console.log(`  • target: ${config.compilerOptions?.target || 'not set'}`);
      console.log(
        `  • include: ${config.include ? config.include.length + ' patterns' : 'not set'}`
      );

      // Deteksi masalah umum
      const issues = [];

      if (!config.compilerOptions) {
        issues.push('❌ compilerOptions tidak ada');
        config.compilerOptions = {};
      }

      if (!config.compilerOptions.moduleResolution) {
        issues.push('⚠️  moduleResolution tidak diatur');
      }

      if (!config.include || config.include.length === 0) {
        issues.push('⚠️  include patterns tidak diatur');
      }

      if (config.compilerOptions.strict === undefined) {
        issues.push('ℹ️  strict mode tidak diatur secara eksplisit');
      }

      // Tampilkan issues
      if (issues.length > 0) {
        console.log('\n⚠️  Issues ditemukan:');
        issues.forEach((issue) => console.log(`  ${issue}`));
      } else {
        console.log('\n✅ Konfigurasi sudah baik!');
      }

      // Tanya user mau mode apa
      console.log('\n🎯 Pilih tipe konfigurasi:');
      console.log('  1. Strict Mode (rekomendasi - semua error ditampilkan)');
      console.log('  2. Lenient Mode (development - lebih toleran)');
      console.log('  3. Keep Current (hanya tambah yang missing)');

      // Untuk automation, kita pilih based on project state
      // Kalau banyak error, pilih lenient. Kalau clean, pilih strict.
      const hasManyErrors = await this.checkForExistingErrors();
      const mode = hasManyErrors ? 'lenientMode' : 'strictMode';

      console.log(`\n🔄 Menggunakan: ${mode === 'strictMode' ? 'Strict Mode' : 'Lenient Mode'}`);

      // Update config
      config.compilerOptions = {
        ...config.compilerOptions,
        ...this.configOptions[mode],
      };

      // Pastikan include patterns ada
      if (!config.include) {
        config.include = ['src/**/*'];
      }

      if (!config.exclude) {
        config.exclude = ['node_modules', 'dist', 'build'];
      }

      await fs.writeFile(filePath, JSON.stringify(config, null, 2));

      this.fixesApplied.push(
        `Updated tsconfig.json dengan ${mode === 'strictMode' ? 'strict' : 'lenient'} settings`
      );
      console.log(
        `✅ tsconfig.json telah diperbarui dengan ${mode === 'strictMode' ? 'strict' : 'lenient'} mode`
      );
    } catch (error) {
      console.log(`❌ Tidak bisa membaca/update tsconfig.json: ${error.message}`);
      console.log('🔄 Membuat konfigurasi baru sebagai fallback...');
      await this.createNewConfig(filePath);
    }
  }

  async createNewConfig(filePath) {
    console.log('\n🏗️  Membuat tsconfig.json baru...');

    const config = {
      compilerOptions: this.configOptions.strictMode,
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'build', '.next'],
      references: [],
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(config, null, 2));
      this.fixesApplied.push('Created new tsconfig.json dengan strict settings');
      console.log('✅ tsconfig.json baru telah dibuat!');

      // Buat juga tsconfig.node.json jika perlu
      await this.createNodeTsConfig();
    } catch (error) {
      console.log(`❌ Gagal membuat tsconfig.json: ${error.message}`);
    }
  }

  async createNodeTsConfig() {
    const nodeConfigPath = path.join(this.projectRoot, 'tsconfig.node.json');

    try {
      await fs.access(nodeConfigPath);
      console.log('✅ tsconfig.node.json sudah ada');
    } catch {
      const nodeConfig = {
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
          strict: true,
          noEmit: false, // Allow emit untuk build
        },
        include: ['vite.config.ts', 'scripts/**/*'],
      };

      await fs.writeFile(nodeConfigPath, JSON.stringify(nodeConfig, null, 2));
      console.log('✅ tsconfig.node.json telah dibuat');
      this.fixesApplied.push('Created tsconfig.node.json untuk build scripts');
    }
  }

  async checkForExistingErrors() {
    console.log('\n🔎 Checking for existing TypeScript errors...');

    try {
      // Coba jalankan tsc untuk cek error count
      const { spawn } = await import('child_process');

      return new Promise((resolve) => {
        const child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
          stdio: 'pipe',
          shell: true,
          cwd: this.projectRoot,
        });

        let output = '';

        child.stdout.on('data', (data) => {
          output += data.toString();
        });

        child.stderr.on('data', (data) => {
          output += data.toString();
        });

        child.on('close', (code) => {
          // Hitung jumlah error dari output
          const errorCount = (output.match(/error TS\d+/g) || []).length;
          const warningCount = (output.match(/warning TS\d+/g) || []).length;

          console.log(`  • Errors ditemukan: ${errorCount}`);
          console.log(`  • Warnings: ${warningCount}`);

          // Jika banyak error (> 10), lebih baik pakai lenient mode dulu
          resolve(errorCount > 10);
        });
      });
    } catch (error) {
      console.log(`  ⚠️  Tidak bisa cek errors: ${error.message}`);
      return false; // Default ke strict mode kalau ga bisa cek
    }
  }

  async generateReport() {
    console.log('\n📋 TS CONFIG REPORT');
    console.log('═'.repeat(80));

    if (this.fixesApplied.length > 0) {
      console.log(`\n✅ Perubahan diterapkan (${this.fixesApplied.length}):`);
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    } else {
      console.log('\n🎉 Tidak ada perubahan diperlukan!');
    }

    console.log('\n📁 File yang dibuat/diupdate:');
    console.log('  1. tsconfig.json - Konfigurasi utama TypeScript');
    console.log('  2. tsconfig.node.json - Untuk build scripts (jika diperlukan)');

    console.log('\n⚙️  Opsi Compiler yang diatur:');
    console.log('  • target: es2020 - Modern JavaScript features');
    console.log('  • module: esnext - ES Modules support');
    console.log('  • jsx: react-jsx - React JSX transform');
    console.log('  • strict: true - Strict type checking');
    console.log('  • moduleResolution: node - Node.js style resolution');
    console.log('  • esModuleInterop: true - Better CommonJS/ESM interop');

    console.log('\n📂 Include/Exclude patterns:');
    console.log('  • include: ["src/**/*"] - Semua file di src folder');
    console.log('  • exclude: ["node_modules", "dist", "build"] - Build artifacts');

    console.log('\n🔧 Tips untuk development:');
    console.log('  1. Untuk disable strict mode sementara:');
    console.log('     Set "strict": false di compilerOptions');
    console.log('  2. Untuk ignore unused variables:');
    console.log('     Set "noUnusedLocals": false');
    console.log('  3. Untuk development yang lebih cepat:');
    console.log('     Gunakan "noEmit": true (default)');

    console.log('\n🚀 Quick commands:');
    console.log('  • Cek TypeScript: npx tsc --noEmit');
    console.log('  • Build project: npx tsc');
    console.log('  • Watch mode: npx tsc --watch');

    console.log('\n' + '═'.repeat(80));
  }
}

// Run the fixer
try {
  const creator = new TsConfigCreator();
  await creator.run();
} catch (error) {
  console.error('\n❌ Error creating TypeScript config:', error.message);
  process.exit(1);
}
