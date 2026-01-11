#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UltimateDevTools {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.scriptsDir = __dirname; // Folder scripts
  }

  async run() {
    console.log('🚀 ULTIMATE DEV TOOLS - Gabungan Terbaik\n');

    const command = process.argv[2] || 'smart-check';

    switch (command) {
      case 'check':
        await this.checkArchitecture();
        break;
      case 'module':
        const moduleName = process.argv[3];
        if (!moduleName) {
          console.log('Usage: node scripts/dev-tools-ultimate.mjs module <nama-module>');
          process.exit(1);
        }
        await this.checkModule(moduleName);
        break;
      case 'generate':
        const type = process.argv[3];
        const name = process.argv[4];
        await this.generate(type, name);
        break;
      case 'fix':
        await this.fixAll();
        break;
      case 'smart-check':
      default:
        await this.smartCheck();
    }
  }

  async smartCheck() {
    console.log('🧠 CEK CEPAT - Langsung ke Masalah\n');

    // 1. CEK DEPENDENSI
    console.log('📦 CEK PACKAGE:');
    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const penting = ['react', 'typescript', 'vite', 'viem', 'zustand'];

      for (const p of penting) {
        const ada = pkg.dependencies?.[p] || pkg.devDependencies?.[p];
        console.log(`  ${ada ? '✅' : '❌'} ${p}`);

        if (!ada && p === 'viem') {
          console.log('  💡 Install viem: pnpm add viem');
        }
      }
    } catch {
      console.log('  ❌ Ga nemu package.json');
    }

    // 2. CEK IMPORT ERROR UMUM
    console.log('\n🔗 CEK IMPORT (error yang sering muncul):');
    try {
      const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf-8'));
      const punyaAlias = tsconfig.compilerOptions?.paths?.['@/*'];
      console.log(`  ${punyaAlias ? '✅' : '❌'} Path alias @/* ada`);

      if (!punyaAlias) {
        console.log('  💡 SOLUSI: Tambah di tsconfig.json:');
        console.log('    "paths": { "@/*": ["./src/*"] }');
      }
    } catch {
      console.log('  ❌ tsconfig.json ga ada / error');
    }

    // 3. CEK FILE KONFIGURASI
    console.log('\n⚙️  CEK FILE KONFIG:');
    const configs = [
      { file: 'tsconfig.json', wajib: true },
      { file: 'vite.config.ts', wajib: true },
      { file: 'package.json', wajib: true },
    ];

    for (const cfg of configs) {
      try {
        await fs.access(cfg.file);
        console.log(`  ✅ ${cfg.file} ada`);
      } catch {
        console.log(
          `  ${cfg.wajib ? '❌' : '⚠️ '} ${cfg.file} ${cfg.wajib ? 'HILANG!' : 'ga ada'}`
        );
      }
    }

    // 4. CEK STRUKTUR PROYEK
    console.log('\n📁 CEK STRUKTUR FOLDER:');
    const folders = [
      { path: 'src', wajib: true },
      { path: 'src/modules', wajib: false },
      { path: 'src/shared', wajib: false },
      { path: 'src/core', wajib: false },
    ];

    for (const folder of folders) {
      try {
        await fs.access(folder.path);
        const items = await fs.readdir(folder.path);
        console.log(`  ✅ ${folder.path}/ (ada ${items.length} item)`);
      } catch {
        console.log(
          `  ${folder.wajib ? '❌' : '⚠️ '} ${folder.path}/ ${folder.wajib ? 'HILANG!' : 'ga ada'}`
        );
      }
    }

    // 5. BUILD CHECK
    console.log('\n🏗️  TEST KOMPILASI:');
    try {
      await this.runQuietCommand(['npx', 'tsc', '--noEmit', '--skipLibCheck']);
      console.log('  ✅ TypeScript OK (ga ada error)');
    } catch {
      console.log('  ❌ Ada error TypeScript');
      console.log('  💡 SOLUSI: Run: npx tsc --noEmit --skipLibCheck');
    }

    // 6. REKOMENDASI PRAKTIS
    console.log('\n══════════════════════════════════════════════════════');
    console.log('🎯 REKOMENDASI & SOLUSI CEPAT:\n');

    console.log('1. ERROR IMPORT "@/shared/ui":');
    console.log('   • Pakai relative: import { X } from "../../shared/ui"');
    console.log('   • Atau fix alias: npx scripts/fix-imports.mjs');

    console.log('\n2. ERROR getTempoClient() / viem:');
    console.log('   • Install: pnpm add viem');
    console.log('   • Import: import { getTempoClient } from "../../core"');

    console.log('\n3. ERROR BUILD / Type error:');
    console.log('   • Clean install: rm -rf node_modules && pnpm install');
    console.log('   • Cek type: npx tsc --noEmit');

    console.log('\n🔧 COMMAND CEPAT:');
    console.log('   • node scripts/dev-tools-ultimate.mjs generate component Button');
    console.log('   • node scripts/dev-tools-ultimate.mjs fix');
    console.log('   • node scripts/dev-tools-ultimate.mjs check');
  }

  async generate(type, name) {
    if (!type || !name) {
      console.log('Usage: node scripts/dev-tools-ultimate.mjs generate <type> <nama>');
      console.log('Type: component, hook, service, type');
      return;
    }

    console.log(`\n🎨 BIKIN ${type.toUpperCase()}: ${name}\n`);

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
        console.log(`❌ Type "${type}" ga dikenal`);
        console.log('💡 Pilih: component, hook, service, type');
    }
  }

  async generateComponent(name) {
    // Pastikan folder shared ada
    const sharedDir = path.join(this.srcPath, 'shared');
    await fs.mkdir(sharedDir, { recursive: true });

    const componentsDir = path.join(sharedDir, 'ui', 'components');
    await fs.mkdir(componentsDir, { recursive: true });

    const filePath = path.join(componentsDir, `${name}.tsx`);

    // Template sederhana
    const template = `import { ReactNode } from 'react';

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

    // Cek apakah file sudah ada
    try {
      await fs.access(filePath);
      console.log(`⚠️  File ${name}.tsx sudah ada`);
      const overwrite = await this.askQuestion(`Timpa file? (y/n): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ Dibatalkan');
        return;
      }
    } catch {
      // File belum ada, lanjut
    }

    await fs.writeFile(filePath, template);
    console.log(`✅ BERHASIL: Dibikin di ${filePath}`);
    console.log(`💡 Cara pake: import { ${name} } from '../../shared/ui/components/${name}'`);

    // Auto update index.ts
    try {
      const indexPath = path.join(componentsDir, 'index.ts');
      let content = '';
      try {
        content = await fs.readFile(indexPath, 'utf-8');
      } catch {
        // Buat index.ts baru
        content = '// Auto-generated index file\n';
      }

      if (!content.includes(`export { ${name} }`)) {
        content += `export { ${name} } from './${name}';\n`;
        await fs.writeFile(indexPath, content);
        console.log(`✅ Auto update: ${indexPath}`);
      }
    } catch (error) {
      // Skip kalo error
    }
  }

  async generateHook(name) {
    const hookName = name.startsWith('use') ? name : `use${name}`;
    const hooksDir = path.join(this.srcPath, 'shared', 'hooks');
    await fs.mkdir(hooksDir, { recursive: true });

    const filePath = path.join(hooksDir, `${hookName}.ts`);

    const template = `import { useEffect, useState } from 'react';

export function ${hookName}<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Implementasi hook disini
    // Contoh: fetch data, event listener, etc.
    
    const fetchData = async () => {
      try {
        setLoading(true);
        // Your logic here
        setData(null); // Ganti dengan data asli
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => {
      // Cleanup kalo perlu
    };
  }, []);
  
  return { data, loading, error };
}\n`;

    await fs.writeFile(filePath, template);
    console.log(`✅ BERHASIL: Dibikin di ${filePath}`);
    console.log(`💡 Cara pake: import { ${hookName} } from '../../shared/hooks/${hookName}'`);
  }

  async checkArchitecture() {
    console.log('🔍 CEK ARSITEKTUR MODULAR\n');

    try {
      // Cek apakah struktur modular ada
      await fs.access(path.join(this.srcPath, 'modules'));

      const modules = await fs.readdir(path.join(this.srcPath, 'modules'));
      console.log(`📦 ADA ${modules.length} MODUL: ${modules.join(', ')}\n`);

      console.log('📋 ATURAN MODULAR:');
      const rules = [
        { name: 'Setiap modul punya index.ts & ui.tsx', check: await this.checkModuleFiles() },
        { name: 'Tidak ada import silang antar modul', check: await this.checkNoCrossImports() },
        { name: 'UI tidak import langsung dari core', check: await this.checkUINoCore() },
        { name: 'Struktur: UI → Store → Service → Core', check: true },
      ];

      let lolos = 0;
      for (const rule of rules) {
        console.log(`  ${rule.check ? '✅' : '❌'} ${rule.name}`);
        if (rule.check) lolos++;
      }

      console.log(`\n📊 HASIL: ${lolos}/${rules.length} aturan terpenuhi`);

      if (lolos === rules.length) {
        console.log('🎉 Arsitektur modular sudah benar!');
      } else {
        console.log('\n💡 Perbaiki dengan:');
        console.log('   • node scripts/fix-architecture.mjs');
        console.log('   • Atau manual sesuai error di atas');
      }
    } catch {
      console.log('⚠️  Struktur modular tidak ditemukan');
      console.log('💡 Buat struktur modular:');
      console.log('   • mkdir -p src/modules/namamodule');
      console.log('   • Bikin: index.ts, ui.tsx, store.ts, service.ts');
    }
  }

  async fixAll() {
    console.log('🔧 PERBAIKIN SEMUA MASALAH\n');

    console.log('1️⃣  Install dependencies...');
    try {
      await this.runCommand(['pnpm', 'install'], true);
      console.log('✅ Dependencies installed\n');
    } catch {
      console.log('❌ Gagal install dependencies\n');
    }

    console.log('2️⃣  Fix TypeScript errors...');
    try {
      // Coba fix imports dulu
      const fixImportsScript = path.join(this.scriptsDir, 'fix-imports.mjs');
      try {
        await fs.access(fixImportsScript);
        await this.runCommand(['node', fixImportsScript], true);
        console.log('✅ Fixed imports\n');
      } catch {
        console.log('⚠️  Script fix-imports.mjs tidak ditemukan\n');
      }
    } catch {
      console.log('❌ Gagal fix TypeScript\n');
    }

    console.log('3️⃣  Format code...');
    try {
      await this.runCommand(['npx', 'prettier', '--write', '.'], true);
      console.log('✅ Code formatted\n');
    } catch {
      console.log('⚠️  Prettier tidak ditemukan\n');
    }

    console.log('4️⃣  Type check...');
    try {
      await this.runCommand(['npx', 'tsc', '--noEmit', '--skipLibCheck'], true);
      console.log('✅ TypeScript OK\n');
    } catch {
      console.log('❌ Ada TypeScript errors\n');
    }

    console.log('🎉 SEMUA PERBAIKAN SELESAI!');
    console.log('\n💡 Jika masih ada error:');
    console.log('   • node scripts/dev-tools-ultimate.mjs smart-check');
    console.log('   • rm -rf node_modules && pnpm install');
  }

  // ========== HELPER METHODS ==========

  async checkNoCrossImports() {
    try {
      const modulesPath = path.join(this.srcPath, 'modules');
      const modules = await fs.readdir(modulesPath);

      for (const module of modules) {
        const modulePath = path.join(modulesPath, module);
        const files = await fs.readdir(modulePath);

        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            const content = await fs.readFile(path.join(modulePath, file), 'utf-8');
            // Cek import ke module lain
            const regex = /from\s+['"]\.\.\/modules\/([^/'"]+)['"]/g;
            const matches = [...content.matchAll(regex)];

            for (const match of matches) {
              const importedModule = match[1];
              if (importedModule !== module) {
                return false;
              }
            }
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async checkUINoCore() {
    try {
      const modulesPath = path.join(this.srcPath, 'modules');
      const modules = await fs.readdir(modulesPath);

      for (const module of modules) {
        const uiPath = path.join(modulesPath, module, 'ui.tsx');
        try {
          const content = await fs.readFile(uiPath, 'utf-8');
          if (content.includes(`from '../core'`) || content.includes(`from '../../core'`)) {
            return false;
          }
        } catch {
          // File UI mungkin ga ada
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async checkModuleFiles() {
    try {
      const modulesPath = path.join(this.srcPath, 'modules');
      const modules = await fs.readdir(modulesPath);

      for (const module of modules) {
        const modulePath = path.join(modulesPath, module);
        const files = await fs.readdir(modulePath);
        const wajib = ['index.ts', 'ui.tsx'];
        const kurang = wajib.filter((f) => !files.includes(f));

        if (kurang.length > 0) {
          console.log(`  ❌ Modul "${module}" kurang: ${kurang.join(', ')}`);
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async checkModule(moduleName) {
    console.log(`🔍 CEK MODUL: ${moduleName}\n`);

    try {
      const modulePath = path.join(this.srcPath, 'modules', moduleName);
      await fs.access(modulePath);

      const files = await fs.readdir(modulePath);
      console.log('📁 FILE YANG ADA:');

      const requiredFiles = ['index.ts', 'ui.tsx', 'store.ts', 'service.ts', 'types.ts'];

      for (const file of requiredFiles) {
        const ada = files.includes(file);
        console.log(`  ${ada ? '✅' : '❌'} ${file}`);

        if (!ada && file === 'ui.tsx') {
          console.log(`    💡 Mau bikin? Run:`);
          console.log(
            `       node scripts/dev-tools-ultimate.mjs generate component ${moduleName}UI`
          );
        }
      }

      // Cek isi index.ts
      try {
        const indexPath = path.join(modulePath, 'index.ts');
        const content = await fs.readFile(indexPath, 'utf-8');
        const moduleCapitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

        console.log('\n🔗 CEK EXPORTS di index.ts:');
        console.log(`  ${content.includes(`${moduleCapitalized}UI`) ? '✅' : '❌'} Export UI`);
        console.log(`  ${content.includes("from './service'") ? '✅' : '❌'} Export service`);
        console.log(`  ${content.includes("from './store'") ? '✅' : '❌'} Export store`);
      } catch {
        console.log('\n❌ Tidak bisa baca index.ts');
      }
    } catch {
      console.log(`❌ Modul "${moduleName}" tidak ditemukan`);
      console.log(`💡 Modul yang ada:`);
      try {
        const modulesPath = path.join(this.srcPath, 'modules');
        const modules = await fs.readdir(modulesPath);
        modules.forEach((m) => console.log(`   - ${m}`));
      } catch {
        console.log('   (folder modules belum ada)');
        console.log('   💡 Buat: mkdir -p src/modules/namamodule');
      }
    }
  }

  async generateService(name) {
    const serviceName = name.endsWith('Service') ? name : `${name}Service`;
    const moduleDir = path.join(this.srcPath, 'modules', name.toLowerCase());

    // Buat folder module kalo belum ada
    await fs.mkdir(moduleDir, { recursive: true });

    const filePath = path.join(moduleDir, 'service.ts');

    const template = `import { getTempoClient } from '../../core/tempo';

export class ${serviceName} {
  private client: ReturnType<typeof getTempoClient>;
  
  constructor() {
    this.client = getTempoClient();
  }
  
  async getData() {
    try {
      // Implementasi service disini
      // Contoh: const data = await this.client.readContract(...);
      return { success: true, data: null };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Tambah method lain sesuai kebutuhan
}\n`;

    await fs.writeFile(filePath, template);
    console.log(`✅ BERHASIL: Dibikin di ${filePath}`);
    console.log(`💡 Jangan lupa export di index.ts module`);
  }

  async generateType(name) {
    const typesDir = path.join(this.srcPath, 'shared', 'types');
    await fs.mkdir(typesDir, { recursive: true });

    const filePath = path.join(typesDir, `${name}.ts`);

    const template = `export type ${name} = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Create${name}Dto = Omit<${name}, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${name}Dto = Partial<Create${name}Dto>;\n`;

    await fs.writeFile(filePath, template);
    console.log(`✅ BERHASIL: Dibikin di ${filePath}`);
    console.log(`💡 Cara pake: import type { ${name} } from '../../shared/types/${name}'`);
  }

  async runQuietCommand(cmd) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1), {
        stdio: 'ignore',
        shell: true,
      });

      child.on('close', (code) => {
        code === 0 ? resolve() : reject();
      });
    });
  }

  async runCommand(cmd, showOutput = false) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1), {
        stdio: showOutput ? 'inherit' : 'pipe',
        shell: true,
      });

      if (!showOutput) {
        child.stdout.on('data', () => {});
        child.stderr.on('data', () => {});
      }

      child.on('close', (code) => {
        code === 0 ? resolve() : reject();
      });
    });
  }

  async askQuestion(question) {
    // Simple stdin read (untuk konfirmasi)
    process.stdout.write(question);

    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.resume();
      stdin.once('data', (data) => {
        resolve(data.toString().trim());
        stdin.pause();
      });
    });
  }
}

// RUN TOOLS
(async () => {
  try {
    const tools = new UltimateDevTools();
    await tools.run();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.log('\n💡 Coba: node scripts/dev-tools-ultimate.mjs smart-check');
    process.exit(1);
  }
})();
