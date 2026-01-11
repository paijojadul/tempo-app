#!/usr/bin/env node

class QuickStart {
  async run() {
    console.log('🚀 Quick Start Guide\n');
    console.log('═'.repeat(80));

    console.log('\n🔧 ESSENTIAL COMMANDS:');

    const commands = [
      'node scripts/dev-tools-ultimate.mjs smart-check',
      'node scripts/dev-tools-ultimate.mjs fix',
      'node scripts/audit.mjs',
      'node scripts/create-module.mjs <name>',
      'node scripts/fix-module.mjs --all',
    ];

    commands.forEach((cmd, i) => {
      console.log(`${i + 1}. ${cmd}`);
    });

    console.log('\n📁 PROJECT STRUCTURE:');

    const structure = [
      'src/modules/        - Feature modules (accounts, payments, etc)',
      '  module/ui.tsx     - React components',
      '  module/store.ts   - Zustand state',
      '  module/service.ts - Business logic & Tempo calls',
      'src/core/tempo/     - Tempo blockchain integration',
      'src/shared/         - Shared components & utilities',
      'scripts/            - Development tools',
    ];

    structure.forEach((line) => console.log(`  ${line}`));

    console.log('\n🎯 GET STARTED:');
    console.log('1. Check project: node scripts/dev-tools-ultimate.mjs smart-check');
    console.log('2. Fix issues: node scripts/dev-tools-ultimate.mjs fix');
    console.log('3. Create module: node scripts/create-module.mjs accounts');
    console.log('4. Start dev: npm run dev');

    console.log('\n' + '═'.repeat(80));
  }
}

try {
  const guide = new QuickStart();
  guide.run();
} catch (error) {
  console.error('❌ Error:', error.message);
}
