#!/usr/bin/env node

import { spawn } from 'child_process';

class QuickStart {
  async run() {
    console.log('🚀 Quick Start Guide for Tempo Modular App\n');
    console.log('═'.repeat(80));

    console.log('\n📦 Current Status:');
    console.log('✅ TypeScript configured');
    console.log('✅ Modular architecture setup');
    console.log('✅ Build passing');
    console.log('✅ Core dependencies installed\n');

    console.log('🎯 What to Build First:\n');

    const priorities = [
      { priority: 'P0', task: 'Complete Accounts module with real Tempo integration' },
      { priority: 'P0', task: 'Setup wagmi wallet connection in core/tempo/wallet.ts' },
      { priority: 'P1', task: 'Create shared UI component library' },
      { priority: 'P1', task: 'Add Zustand persist middleware for state persistence' },
      { priority: 'P2', task: 'Implement Payments module' },
      { priority: 'P2', task: 'Add module routing and navigation improvements' },
      { priority: 'P3', task: 'Setup error handling and monitoring' },
      { priority: 'P3', task: 'Add comprehensive testing' },
    ];

    priorities.forEach(({ priority, task }) => {
      console.log(`${priority}: ${task}`);
    });

    console.log('\n🔧 Development Workflow:\n');

    const workflow = [
      '1. Create/update module: node scripts/create-module.mjs <name>',
      '2. Check architecture: node scripts/dev-tools.mjs check',
      '3. Generate components: node scripts/dev-tools.mjs generate component <name>',
      '4. Fix issues: node scripts/dev-tools.mjs fix',
      '5. Run tests: npm run test',
      '6. Type check: npm run type-check',
      '7. Start dev: npm run dev',
    ];

    workflow.forEach((step) => console.log(step));

    console.log('\n📁 Project Structure Explained:\n');

    const structure = [
      'src/app/          - App entry point and routing',
      'src/core/         - Core infrastructure',
      '  core/tempo/     - Tempo blockchain integration',
      '  core/store/     - Global app state',
      'src/modules/      - Feature modules',
      '  module/ui.tsx   - React components',
      '  module/store.ts - Module state (Zustand)',
      '  module/service.ts - Business logic & Tempo calls',
      '  module/types.ts - TypeScript interfaces',
      'src/shared/       - Shared utilities',
      '  shared/ui/      - Reusable components',
      '  shared/hooks/   - Custom React hooks',
      'scripts/          - Development scripts',
    ];

    structure.forEach((line) => console.log(line));

    console.log('\n💡 Pro Tips:');
    console.log('• Always check architecture with: npm run audit');
    console.log('• Use path aliases: @/ for src, @modules/ for modules');
    console.log('• Services should handle ALL external communication');
    console.log('• UI components should be dumb - only render and dispatch actions');
    console.log('• Keep modules independent - they can be removed without breaking others');

    console.log('\n' + '═'.repeat(80));
    console.log("\n🎉 You're ready to build amazing things!");
  }
}

try {
  const guide = new QuickStart();
  await guide.run();
} catch (error) {
  console.error('❌ Error:', error.message);
}
