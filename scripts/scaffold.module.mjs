#!/usr/bin/env node
import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const moduleName = process.argv[2];

if (!moduleName) {
  console.error('❌ Module name required');
  console.error('👉 Usage: node scripts/scaffold.module.mjs accounts');
  process.exit(1);
}

const baseDir = join('src/modules', moduleName);

const files = {
  'ui.tsx': `import { use${capitalize(moduleName)}Store } from './store';

export function ${capitalize(moduleName)}UI() {
  const store = use${capitalize(moduleName)}Store();

  return (
    <div>
      <h2>${capitalize(moduleName)}</h2>

      {store.loading && <p>Loading...</p>}
      {store.error && <p>Error: {store.error}</p>}

      <button onClick={() => store.reset()}>Reset</button>
    </div>
  );
}
`,

  'store.ts': `import { createBaseStore } from '@shared/store/patterns';
import type { ${capitalize(moduleName)} } from './types';

export const use${capitalize(moduleName)}Store =
  createBaseStore<${capitalize(moduleName)}>('${moduleName}');
`,

  'service.ts': `// Service: ONLY data access, no state
export async function fetch${capitalize(moduleName)}() {
  // TODO: call core service
  return [];
}
`,

  'types.ts': `export type ${capitalize(moduleName)} = {
  id: string;
};
`,

  'index.ts': `export * from './ui';
`,
};

mkdirSync(baseDir, { recursive: true });

for (const [file, content] of Object.entries(files)) {
  const filePath = join(baseDir, file);

  if (existsSync(filePath)) {
    console.log(`✅ ${moduleName}/${file} exists`);
    continue;
  }

  writeFileSync(filePath, content);
  console.log(`🆕 created ${moduleName}/${file}`);
}

console.log(`🎉 MODULE "${moduleName}" READY`);
