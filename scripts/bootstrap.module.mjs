// scripts/bootstrap.module.mjs
import fs from 'fs';
import path from 'path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('❌ Module name required');
  console.error('Usage: node scripts/bootstrap.module.mjs <module-name>');
  process.exit(1);
}

const ROOT = process.cwd();
const MODULE_DIR = path.join(ROOT, 'src/modules', moduleName);

console.log(`🚀 BOOTSTRAP MODULE: ${moduleName}\n`);

if (fs.existsSync(MODULE_DIR)) {
  console.error('❌ Module already exists:', moduleName);
  process.exit(1);
}

fs.mkdirSync(MODULE_DIR, { recursive: true });

const files = {
  'index.ts': `export { ${capitalize(moduleName)}UI } from './ui';\n`,
  'ui.tsx': uiTemplate(moduleName),
  'store.ts': storeTemplate(moduleName),
  'service.ts': serviceTemplate(moduleName),
};

for (const [file, content] of Object.entries(files)) {
  const filePath = path.join(MODULE_DIR, file);
  fs.writeFileSync(filePath, content);
  console.log('✅ created', `modules/${moduleName}/${file}`);
}

console.log('\n🎉 MODULE BOOTSTRAP DONE');

function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function uiTemplate(name) {
  const C = capitalize(name);
  return `import { use${C}Store } from './store';

export function ${C}UI() {
  const store = use${C}Store();

  return (
    <section>
      <h2>${C}</h2>

      {store.loading && <p>Loading...</p>}
      {store.error && <p style={{ color: 'red' }}>{store.error}</p>}

      <button onClick={store.fetchAll}>Refresh</button>
    </section>
  );
}
`;
}

function storeTemplate(name) {
  const C = capitalize(name);
  return `import { create } from 'zustand';
import { ${name}Service } from './service';

type ${C}State = {
  items: any[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
};

export const use${C}Store = create<${C}State>((set) => ({
  items: [],
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const data = await ${name}Service.fetchAll();
      set({ items: data, loading: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Unknown error', loading: false });
    }
  },
}));
`;
}

function serviceTemplate(name) {
  return `import { tempoClient } from '../../core/tempo';

export const ${name}Service = {
  async fetchAll() {
    return tempoClient.get('/${name}');
  },
};
`;
}
