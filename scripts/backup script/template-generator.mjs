#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
  }

  async run() {
    const template = process.argv[2];
    const name = process.argv[3];

    if (!template || !name) {
      this.showHelp();
      return;
    }

    switch (template) {
      case 'service':
        await this.generateServiceTemplate(name);
        break;
      case 'store':
        await this.generateStoreTemplate(name);
        break;
      case 'component':
        await this.generateComponentTemplate(name);
        break;
      case 'hook':
        await this.generateHookTemplate(name);
        break;
      default:
        console.log(`Unknown template: ${template}`);
    }
  }

  showHelp() {
    console.log('📝 Template Generator\n');
    console.log('Usage: node scripts/template-generator.mjs <template> <name>\n');
    console.log('Templates:');
    console.log('  service    - Generate service template');
    console.log('  store      - Generate Zustand store template');
    console.log('  component  - Generate React component template');
    console.log('  hook       - Generate React hook template\n');
    console.log('Examples:');
    console.log('  node scripts/template-generator.mjs service UserService');
    console.log('  node scripts/template-generator.mjs store UserStore');
    console.log('  node scripts/template-generator.mjs component UserCard');
  }

  async generateServiceTemplate(name) {
    const template = `import { getTempoClient } from '../../core/tempo';

export interface ${name}Data {
  id: string;
  // Add fields
}

export interface Create${name}DTO {
  // Add fields
}

export async function fetch${name}(id: string): Promise<${name}Data> {
  const client = getTempoClient();
  
  // Implement Tempo blockchain call
  // const data = await client.readContract(...);
  
  return {
    id,
    // Return data
  };
}

export async function create${name}(data: Create${name}DTO): Promise<${name}Data> {
  const client = getTempoClient();
  
  // Implement contract write
  // const hash = await client.writeContract(...);
  
  return {
    id: Date.now().toString(),
    ...data
  };
}

export async function update${name}(id: string, data: Partial<Create${name}DTO>): Promise<${name}Data> {
  const client = getTempoClient();
  
  // Implement update logic
  return {
    id,
    ...data as ${name}Data
  };
}

export async function delete${name}(id: string): Promise<boolean> {
  const client = getTempoClient();
  
  // Implement delete logic
  return true;
}\n`;

    console.log('📋 Service Template:\n');
    console.log(template);

    const save = await this.askQuestion('Save to file? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const fileName = `${name.toLowerCase()}.service.ts`;
      const filePath = path.join(this.projectRoot, 'templates', fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, template);
      console.log(`✅ Template saved to: ${filePath}`);
    }
  }

  async generateStoreTemplate(name) {
    const template = `import { create } from 'zustand';
import { 
  fetch${name}, 
  create${name}, 
  update${name}, 
  delete${name} 
} from './service';
import type { ${name}Data, Create${name}DTO } from './service';

interface ${name}State {
  data: ${name}Data | null;
  items: ${name}Data[];
  loading: boolean;
  error: string | null;
  
  // Actions
  load: (id: string) => Promise<void>;
  loadAll: () => Promise<void>;
  create: (data: Create${name}DTO) => Promise<void>;
  update: (id: string, data: Partial<Create${name}DTO>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  data: null,
  items: [],
  loading: false,
  error: null,
};

export const use${name}Store = create<${name}State>((set, get) => ({
  ...initialState,
  
  load: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await fetch${name}(id);
      set({ data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load', 
        loading: false 
      });
    }
  },
  
  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      // Implement batch loading if available
      set({ items: [], loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load items', 
        loading: false 
      });
    }
  },
  
  create: async (data) => {
    set({ loading: true, error: null });
    try {
      const newItem = await create${name}(data);
      set((state) => ({
        items: [...state.items, newItem],
        loading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create', 
        loading: false 
      });
    }
  },
  
  update: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updatedItem = await update${name}(id, data);
      set((state) => ({
        items: state.items.map(item => 
          item.id === id ? updatedItem : item
        ),
        data: state.data?.id === id ? updatedItem : state.data,
        loading: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update', 
        loading: false 
      });
    }
  },
  
  remove: async (id) => {
    set({ loading: true, error: null });
    try {
      const success = await delete${name}(id);
      if (success) {
        set((state) => ({
          items: state.items.filter(item => item.id !== id),
          data: state.data?.id === id ? null : state.data,
          loading: false,
        }));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete', 
        loading: false 
      });
    }
  },
  
  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}));\n`;

    console.log('📋 Store Template:\n');
    console.log(template);

    const save = await this.askQuestion('Save to file? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const fileName = `${name.toLowerCase()}.store.ts`;
      const filePath = path.join(this.projectRoot, 'templates', fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, template);
      console.log(`✅ Template saved to: ${filePath}`);
    }
  }

  async generateComponentTemplate(name) {
    const template = `import { ReactNode } from 'react';

interface ${name}Props {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
  onClick?: () => void;
}

export function ${name}({ 
  children, 
  className = '', 
  variant = 'default',
  onClick 
}: ${name}Props) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-green-600 text-white',
  };
  
  return (
    <div 
      className={\`p-4 rounded-lg \${variantClasses[variant]} \${className}\`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}\n`;

    console.log('📋 Component Template:\n');
    console.log(template);

    const save = await this.askQuestion('Save to file? (y/n): ');
    if (save.toLowerCase() === 'y') {
      const fileName = `${name}.tsx`;
      const filePath = path.join(this.projectRoot, 'templates', fileName);

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, template);
      console.log(`✅ Template saved to: ${filePath}`);
    }
  }

  async askQuestion(question) {
    process.stdout.write(question);

    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setEncoding('utf8');
      stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}

try {
  const generator = new TemplateGenerator();
  await generator.run();
} catch (error) {
  console.error('❌ Error:', error.message);
}
