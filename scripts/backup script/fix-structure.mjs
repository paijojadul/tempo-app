#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StructureFixer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.fixesApplied = [];
  }

  async run() {
    console.log('🔧 Starting Structure Fix...\n');

    await this.createMissingDirectories();
    await this.createMissingModuleFiles();
    await this.fixModuleStructure();
    await this.createSharedComponents();
    await this.updateAppForNavigation();

    await this.generateReport();
  }

  async createMissingDirectories() {
    console.log('📁 Creating missing directories...');

    const requiredDirs = ['src/shared/ui'];

    for (const dir of requiredDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      try {
        await fs.access(fullPath);
      } catch {
        await fs.mkdir(fullPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
        this.fixesApplied.push(`Created directory: ${dir}`);
      }
    }
    console.log('');
  }

  async createMissingModuleFiles() {
    console.log('📦 Creating missing module files...');

    const modules = ['accounts', 'payments', 'exchange', 'issuance'];
    const moduleFiles = ['index.ts', 'ui.tsx', 'service.ts', 'store.ts'];

    for (const moduleName of modules) {
      const modulePath = path.join(this.srcPath, 'modules', moduleName);

      // Check existing files
      const existingFiles = await fs.readdir(modulePath).catch(() => []);

      // Create missing files
      for (const fileName of moduleFiles) {
        if (!existingFiles.includes(fileName)) {
          const filePath = path.join(modulePath, fileName);
          await this.createModuleFile(moduleName, fileName, filePath);
          console.log(`  ✅ Created: modules/${moduleName}/${fileName}`);
        }
      }
    }
    console.log('');
  }

  async createModuleFile(moduleName, fileName, filePath) {
    const templates = {
      'index.ts': `export { ${this.capitalize(moduleName)}UI } from './ui';
export * from './service';
export * from './store';\n`,

      'ui.tsx': `import { use${this.capitalize(moduleName)}Store } from './store';

export function ${this.capitalize(moduleName)}UI() {
  const store = use${this.capitalize(moduleName)}Store();
  
  return (
    <div className="${moduleName}-module">
      <h2>${this.capitalize(moduleName)} Module</h2>
      <p>Module UI implementation goes here</p>
    </div>
  );
}\n`,

      'service.ts': `// ${moduleName} service - handles business logic and external communication
// Can access core/tempo directly

export async function fetch${this.capitalize(moduleName)}Data() {
  // Implement service logic here
  await new Promise(resolve => setTimeout(resolve, 100));
  return { data: 'Sample data' };
}

export async function create${this.capitalize(moduleName)}Item(data: any) {
  // Implement creation logic here
  return { success: true, id: Date.now().toString() };
}\n`,

      'store.ts': `import { create } from 'zustand';
import { fetch${this.capitalize(moduleName)}Data, create${this.capitalize(moduleName)}Item } from './service';

interface ${this.capitalize(moduleName)}State {
  data: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadData: () => Promise<void>;
  createItem: (data: any) => Promise<void>;
  clearError: () => void;
}

export const use${this.capitalize(moduleName)}Store = create<${this.capitalize(moduleName)}State>((set, get) => ({
  data: [],
  loading: false,
  error: null,
  
  loadData: async () => {
    set({ loading: true, error: null });
    try {
      const result = await fetch${this.capitalize(moduleName)}Data();
      set({ data: [result], loading: false });
    } catch (error) {
      set({ error: 'Failed to load data', loading: false });
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await create${this.capitalize(moduleName)}Item(data);
      set((state) => ({
        data: [...state.data, result],
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create item', loading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));\n`,
    };

    if (templates[fileName]) {
      await fs.writeFile(filePath, templates[fileName]);
      this.fixesApplied.push(`Created file: modules/${moduleName}/${fileName}`);
    }
  }

  async fixModuleStructure() {
    console.log('🛠️  Fixing module structure issues...');

    // Check and fix existing modules
    const modulesDir = path.join(this.srcPath, 'modules');
    const items = await fs.readdir(modulesDir);

    for (const item of items) {
      const itemPath = path.join(modulesDir, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        await this.fixSingleModule(item, itemPath);
      }
    }
    console.log('');
  }

  async fixSingleModule(moduleName, modulePath) {
    const requiredFiles = ['index.ts', 'ui.tsx', 'service.ts', 'store.ts'];
    const existingFiles = await fs.readdir(modulePath);

    // Fix existing files if needed
    for (const file of existingFiles) {
      if (requiredFiles.includes(file)) {
        await this.fixFileIfNeeded(moduleName, modulePath, file);
      }
    }
  }

  async fixFileIfNeeded(moduleName, modulePath, fileName) {
    const filePath = path.join(modulePath, fileName);

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      if (fileName === 'index.ts') {
        // Check if index.ts exports correctly
        const capitalized = this.capitalize(moduleName);
        const expectedExport = `export { ${capitalized}UI } from './ui';`;

        if (!content.includes(expectedExport)) {
          // Fix the index.ts
          const fixedContent = `export { ${capitalized}UI } from './ui';
export * from './service';
export * from './store';\n`;

          await fs.writeFile(filePath, fixedContent);
          console.log(`  🔧 Fixed exports in: ${moduleName}/index.ts`);
          this.fixesApplied.push(`Fixed index.ts for ${moduleName}`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Cannot read ${moduleName}/${fileName}: ${error.message}`);
    }
  }

  async createSharedComponents() {
    console.log('🎨 Creating shared UI components...');

    const sharedDir = path.join(this.srcPath, 'shared/ui');

    // Create Button component
    const buttonPath = path.join(sharedDir, 'Button.tsx');
    const buttonContent = `import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  const loadingClass = isLoading ? 'opacity-70 cursor-wait' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${loadingClass} \${disabledClass} \${className}\`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}\n`;

    try {
      await fs.access(buttonPath);
      console.log('  ℹ️  Button.tsx already exists');
    } catch {
      await fs.writeFile(buttonPath, buttonContent);
      console.log('  ✅ Created: shared/ui/Button.tsx');
      this.fixesApplied.push('Created Button component');
    }

    // Create shared index.ts
    const indexPath = path.join(sharedDir, 'index.ts');
    const indexContent = `export { Button } from './Button';
// Add other shared components here\n`;

    try {
      await fs.access(indexPath);
      console.log('  ℹ️  shared/ui/index.ts already exists');
    } catch {
      await fs.writeFile(indexPath, indexContent);
      console.log('  ✅ Created: shared/ui/index.ts');
      this.fixesApplied.push('Created shared/ui/index.ts');
    }

    console.log('');
  }

  async updateAppForNavigation() {
    console.log('🔄 Updating App.tsx for module navigation...');

    const appPath = path.join(this.srcPath, 'app/App.tsx');

    try {
      const content = await fs.readFile(appPath, 'utf-8');

      // Check if app already has navigation
      if (!content.includes('module-nav')) {
        const newAppContent = `import { useState } from 'react';
import { useAppStore } from '../core/store';
import { AccountsUI } from '../modules/accounts';
import { PaymentsUI } from '../modules/payments';
import { ExchangeUI } from '../modules/exchange';
import { IssuanceUI } from '../modules/issuance';

type Module = 'accounts' | 'payments' | 'exchange' | 'issuance';

export function App() {
  const isReady = useAppStore((s) => s.isReady);
  const [currentModule, setCurrentModule] = useState<Module>('accounts');

  if (!isReady) {
    return (
      <div className="app-init">
        <h1>Tempo Modular App</h1>
        <button onClick={() => useAppStore.getState().setReady()}>
          Initialize Application
        </button>
      </div>
    );
  }

  const renderModule = () => {
    switch (currentModule) {
      case 'accounts': return <AccountsUI />;
      case 'payments': return <PaymentsUI />;
      case 'exchange': return <ExchangeUI />;
      case 'issuance': return <IssuanceUI />;
      default: return <AccountsUI />;
    }
  };

  return (
    <div className="app-container">
      <nav className="module-nav">
        <button 
          onClick={() => setCurrentModule('accounts')}
          className={currentModule === 'accounts' ? 'active' : ''}
        >
          Accounts
        </button>
        <button 
          onClick={() => setCurrentModule('payments')}
          className={currentModule === 'payments' ? 'active' : ''}
        >
          Payments
        </button>
        <button 
          onClick={() => setCurrentModule('exchange')}
          className={currentModule === 'exchange' ? 'active' : ''}
        >
          Exchange
        </button>
        <button 
          onClick={() => setCurrentModule('issuance')}
          className={currentModule === 'issuance' ? 'active' : ''}
        >
          Issuance
        </button>
      </nav>

      <main className="module-container">
        {renderModule()}
      </main>
    </div>
  );
}\n`;

        await fs.writeFile(appPath, newAppContent);
        console.log('  ✅ Updated App.tsx with module navigation');
        this.fixesApplied.push('Updated App.tsx with navigation');
      } else {
        console.log('  ℹ️  App.tsx already has navigation');
      }
    } catch (error) {
      console.log('  ❌ Could not update App.tsx:', error.message);
    }

    console.log('');
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async generateReport() {
    console.log('📋 FIX REPORT');
    console.log('═'.repeat(80));

    if (this.fixesApplied.length > 0) {
      console.log(`\n✅ Fixes Applied (${this.fixesApplied.length}):`);
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });

      console.log('\n💡 Next Steps:');
      console.log('  1. Run: node scripts/audit.mjs (to verify fixes)');
      console.log('  2. Install dependencies: npm install zustand');
      console.log('  3. Start development: npm run dev');
    } else {
      console.log('\n🎉 No fixes needed! Structure is already correct.');
    }

    console.log('\n' + '═'.repeat(80));
  }
}

// Run fixer
try {
  const fixer = new StructureFixer();
  await fixer.run();
} catch (error) {
  console.error('❌ Error running fixer:', error.message);
  process.exit(1);
}
