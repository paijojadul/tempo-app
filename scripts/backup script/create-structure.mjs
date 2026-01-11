import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createFile(filePath, content = '') {
  const dir = path.dirname(filePath);

  // Buat direktori jika belum ada
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Tulis file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Created: ${filePath}`);
}

function main() {
  console.log('🚀 Creating React + Tempo project structure...\n');

  // STEP 4: Create app files
  console.log('📁 STEP 4: Creating app files...');

  createFile(
    'src/app/main.tsx',
    `import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`
  );

  createFile(
    'src/app/App.tsx',
    `import { AccountsUI } from '../modules/accounts'

export function App() {
  return <AccountsUI />
}`
  );

  // STEP 5: Create core layer
  console.log('\n📁 STEP 5: Creating core layer...');

  createFile(
    'src/core/tempo/client.ts',
    `export function getTempoClient() {
  throw new Error('Tempo client not implemented yet')
}`
  );

  createFile(
    'src/core/tempo/wallet.ts',
    `export function connectWallet() {
  throw new Error('Wallet not implemented yet')
}`
  );

  createFile(
    'src/core/tempo/chains.ts',
    `export const TEMPO_TESTNET = {
  id: 0,
  name: 'Tempo Testnet',
}`
  );

  createFile(
    'src/core/tempo/index.ts',
    `export * from './client'
export * from './wallet'
export * from './chains'`
  );

  // STEP 6: Create modules with consistent pattern
  console.log('\n📁 STEP 6: Creating modules...');

  const modules = ['accounts', 'payments', 'issuance', 'exchange'];

  modules.forEach((moduleName) => {
    console.log(`  Creating ${moduleName} module...`);

    // UI file
    createFile(
      `src/modules/${moduleName}/ui.tsx`,
      `export function ${capitalizeFirstLetter(moduleName)}UI() {
  return <div>${capitalizeFirstLetter(moduleName)} Module</div>
}`
    );

    // Store file
    createFile(`src/modules/${moduleName}/store.ts`, `export {}`);

    // Service file
    createFile(
      `src/modules/${moduleName}/service.ts`,
      `export async function run${capitalizeFirstLetter(moduleName)}() {
  // TODO
}`
    );

    // Index file
    createFile(
      `src/modules/${moduleName}/index.ts`,
      `export { ${capitalizeFirstLetter(moduleName)}UI } from './ui'`
    );
  });

  console.log('\n✅ Project structure created successfully!');
  console.log('\n📁 Structure created:');
  console.log('├── src/');
  console.log('│   ├── app/');
  console.log('│   │   ├── main.tsx');
  console.log('│   │   └── App.tsx');
  console.log('│   ├── core/');
  console.log('│   │   └── tempo/');
  console.log('│   │       ├── client.ts');
  console.log('│   │       ├── wallet.ts');
  console.log('│   │       ├── chains.ts');
  console.log('│   │       └── index.ts');
  console.log('│   └── modules/');
  console.log('│       ├── accounts/');
  console.log('│       │   ├── ui.tsx');
  console.log('│       │   ├── store.ts');
  console.log('│       │   ├── service.ts');
  console.log('│       │   └── index.ts');
  console.log('│       ├── payments/');
  console.log('│       ├── issuance/');
  console.log('│       └── exchange/');
  console.log('\n🎉 Run the app with: npm run dev');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Jalankan script
try {
  main();
} catch (error) {
  console.error('❌ Error creating structure:', error.message);
  process.exit(1);
}
