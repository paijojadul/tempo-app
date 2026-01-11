#!/usr/bin/env node
// scripts/fix-dependencies.mjs

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import readline from 'readline';

class DependencyFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async run() {
    console.log('📦 Safe Dependency Management\n');
    console.log('═'.repeat(80));

    const args = process.argv.slice(2);

    if (args.includes('--check') || args.length === 0) {
      await this.checkDependencies();
    } else if (args.includes('--install')) {
      await this.safeInstall();
    } else if (args.includes('--clean')) {
      await this.cleanInstall();
    } else {
      this.showHelp();
    }

    this.rl.close();
  }

  showHelp() {
    console.log(`
📦 Safe Dependency Manager

Usage: node scripts/fix-dependencies.mjs [option]

Options:
  --check    Check for missing dependencies (default)
  --install  Safe install (does NOT delete node_modules)
  --clean    Clean install (asks for confirmation before deleting)

Examples:
  node scripts/fix-dependencies.mjs --check      # Check only
  node scripts/fix-dependencies.mjs --install    # Safe install
  node scripts/fix-dependencies.mjs --clean      # Clean install (with confirmation)

⚠️  Warning: --clean will DELETE node_modules folder!
    `);
  }

  async checkDependencies() {
    console.log('🔍 Checking project dependencies...\n');

    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      console.log('📄 Package.json Status:\n');

      // Required packages
      const requirements = {
        'React 18': { type: 'deps', name: 'react', version: '^18.2.0' },
        'React DOM': { type: 'deps', name: 'react-dom', version: '^18.2.0' },
        TypeScript: { type: 'devDeps', name: 'typescript', version: '^5.3.0' },
        Vite: { type: 'devDeps', name: 'vite', version: '^5.1.0' },
        'Babel JSX Plugin': {
          type: 'devDeps',
          name: '@babel/plugin-transform-react-jsx',
          version: '^7.24.0',
        },
        'Vite React Plugin': { type: 'devDeps', name: '@vitejs/plugin-react', version: '^4.2.0' },
        Zustand: { type: 'deps', name: 'zustand', version: '^4.4.0' },
        'Tailwind CSS': { type: 'devDeps', name: 'tailwindcss', version: '^3.4.0' },
      };

      let allGood = true;

      for (const [label, req] of Object.entries(requirements)) {
        const deps = req.type === 'deps' ? pkg.dependencies : pkg.devDependencies;
        const hasDep = deps?.[req.name];

        if (hasDep) {
          console.log(`✅ ${label}: ${req.name}@${hasDep}`);
        } else {
          console.log(`❌ ${label}: MISSING - requires ${req.name}@${req.version}`);
          allGood = false;
        }
      }

      // Check node_modules
      const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
      try {
        await fs.access(nodeModulesPath);
        const stats = await fs.stat(nodeModulesPath);
        const sizeMB = await this.getFolderSize(nodeModulesPath);

        console.log(`\n📁 node_modules: ✅ Found (${sizeMB} MB)`);

        // Check critical packages in node_modules
        const criticalPackages = ['react', 'vite', '@vitejs/plugin-react'];
        const missingPackages = [];

        for (const pkg of criticalPackages) {
          const pkgPath = path.join(nodeModulesPath, pkg);
          try {
            await fs.access(pkgPath);
          } catch {
            missingPackages.push(pkg);
          }
        }

        if (missingPackages.length > 0) {
          console.log(`⚠️  Missing in node_modules: ${missingPackages.join(', ')}`);
          allGood = false;
        }
      } catch {
        console.log('\n📁 node_modules: ❌ NOT FOUND');
        allGood = false;
      }

      console.log('\n' + '═'.repeat(80));

      if (allGood) {
        console.log('🎉 All dependencies are properly installed!');
        console.log('💡 Run: npm run dev (to start development server)');
      } else {
        console.log('\n🚨 ISSUES DETECTED:\n');
        console.log('1. For missing packages:');
        console.log('   npm run fix:deps:install');
        console.log('\n2. If still having issues:');
        console.log('   npm run fix:deps:clean (with caution)');
        console.log('\n3. Check build errors:');
        console.log('   npm run type-check');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log('💡 Make sure package.json exists in project root');
    }
  }

  async safeInstall() {
    console.log('📥 Safe Install - Installing missing packages only\n');

    try {
      // Check if package-lock exists
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
      let hasLockFile = false;

      for (const file of lockFiles) {
        try {
          await fs.access(path.join(this.projectRoot, file));
          hasLockFile = true;
          console.log(`🔒 Found lock file: ${file}`);
          break;
        } catch {
          continue;
        }
      }

      if (!hasLockFile) {
        console.log('⚠️  No lock file found. This is a fresh install.');
      }

      console.log('\n📦 Installing dependencies...');
      await this.runCommand(['npm', 'install'], 'Installing with npm');

      console.log('\n✅ Installation completed!');
      console.log('💡 Next steps:');
      console.log('   1. Check installation: npm run fix:deps --check');
      console.log('   2. Start dev server: npm run dev');
      console.log('   3. Run checks: npm run check');
    } catch (error) {
      console.log(`❌ Installation failed: ${error.message}`);
      console.log('\n💡 Try these alternatives:');
      console.log('   1. Use pnpm: pnpm install');
      console.log('   2. Use yarn: yarn install');
      console.log('   3. Clean install: npm run fix:deps:clean');
    }
  }

  async cleanInstall() {
    console.log('🧹 CLEAN INSTALL - ⚠️  WARNING ⚠️\n');
    console.log('This will DELETE node_modules and reinstall from scratch.');
    console.log('Make sure you have committed your changes.\n');

    const answer = await this.askQuestion('Are you sure? (yes/NO): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      return;
    }

    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    const lockFiles = [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'node_modules/.vite',
      'node_modules/.cache',
    ];

    try {
      // Remove node_modules
      try {
        await fs.access(nodeModulesPath);
        console.log('🗑️  Removing node_modules...');
        await fs.rm(nodeModulesPath, { recursive: true, force: true });
        console.log('✅ node_modules removed');
      } catch {
        console.log('📁 node_modules not found (already clean)');
      }

      // Remove lock files
      console.log('\n🔓 Removing lock files...');
      for (const file of lockFiles) {
        try {
          await fs.rm(path.join(this.projectRoot, file), { force: true });
          console.log(`   Removed: ${file}`);
        } catch {
          // File doesn't exist
        }
      }

      console.log('\n📥 Installing fresh dependencies...');
      await this.runCommand(['npm', 'install'], 'Fresh install');

      console.log('\n🎉 Clean install completed successfully!');
      console.log('\n💡 Verification steps:');
      console.log('   1. Check: npm run fix:deps --check');
      console.log('   2. Build: npm run type-check');
      console.log('   3. Start: npm run dev');
    } catch (error) {
      console.log(`❌ Clean install failed: ${error.message}`);
      console.log('\n💡 Manual steps:');
      console.log('   1. Delete node_modules manually');
      console.log('   2. Delete package-lock.json');
      console.log('   3. Run: npm install');
    }
  }

  async runCommand(cmd, description = 'Running command') {
    console.log(`\n⚡ ${description}: ${cmd.join(' ')}`);

    return new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1), {
        stdio: 'inherit',
        shell: true,
        cwd: this.projectRoot,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
    });
  }

  async getFolderSize(folderPath) {
    try {
      const { execSync } = await import('child_process');
      const size = execSync(`du -sh "${folderPath}" | cut -f1`, { encoding: 'utf8' }).trim();
      return size;
    } catch {
      return 'unknown';
    }
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run fixer
(async () => {
  const fixer = new DependencyFixer();
  await fixer.run();
})();
