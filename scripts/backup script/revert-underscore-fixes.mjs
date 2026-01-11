#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function revertUnderscoreFixes() {
  console.log('🔄 Reverting underscore fixes...\n');

  const projectRoot = process.cwd();
  const filesToFix = [
    'src/app/App.tsx',
    'src/core/store/app.store.ts',
    'src/core/tempo/chains.ts',
    'src/core/tempo/mocks/tempo-chains.ts',
    'src/core/tempo/mocks/viem.ts',
    'src/core/tempo/mocks/wagmi.ts',
    'src/modules/accounts/store.ts',
    'src/modules/accounts/ui.tsx',
    'src/modules/transactions/store.ts',
    'src/modules/transactions/ui.tsx',
    'src/shared/ui/Button.tsx',
    'src/shared/ui/components/Card.tsx',
    'src/shared/utils.ts',
  ];

  for (const file of filesToFix) {
    const filePath = path.join(projectRoot, file);

    try {
      await fs.access(filePath);
      let content = await fs.readFile(filePath, 'utf-8');

      // Remove underscores from exports and variables
      content = content.replace(/_useAppStore/g, 'useAppStore');
      content = content.replace(/_TEMPO_TESTNET/g, 'TEMPO_TESTNET');
      content = content.replace(/_tempoModerato/g, 'tempoModerato');
      content = content.replace(/_webAuthn/g, 'webAuthn');
      content = content.replace(/_useAccountsStore/g, 'useAccountsStore');
      content = content.replace(/_useTransactionsStore/g, 'useTransactionsStore');
      content = content.replace(/_renderModule/g, 'renderModule');
      content = content.replace(/_variantStyles/g, 'variantStyles');
      content = content.replace(/_titleColors/g, 'titleColors');
      content = content.replace(/_load/g, 'load');
      content = content.replace(/_reset/g, 'reset');
      content = content.replace(/_newItem/g, 'newItem');
      content = content.replace(/_handleCreate/g, 'handleCreate');
      content = content.replace(/_handleRefresh/g, 'handleRefresh');
      content = content.replace(/_baseClasses/g, 'baseClasses');
      content = content.replace(/_variantClasses/g, 'variantClasses');
      content = content.replace(/_loadingClass/g, 'loadingClass');
      content = content.replace(/_disabledClass/g, 'disabledClass');
      content = content.replace(/_formatDate/g, 'formatDate');
      content = content.replace(/_formatCurrency/g, 'formatCurrency');
      content = content.replace(/_debounce/g, 'debounce');
      content = content.replace(/_generateId/g, 'generateId');

      await fs.writeFile(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    } catch (error) {
      console.log(`⚠️  Skipped: ${file} (${error.message})`);
    }
  }

  console.log('\n✅ Underscore fixes reverted!');
  console.log('\n🔍 Now run the updated TypeScript fixer:');
  console.log('   node scripts/fix-typescript-errors.mjs');
}

revertUnderscoreFixes().catch(console.error);
