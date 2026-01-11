#!/usr/bin/env node
import { execSync } from 'node:child_process';

const steps = [
  {
    name: 'Audit Structure',
    cmd: 'node scripts/audit.structure.mjs',
  },
  {
    name: 'Audit Imports',
    cmd: 'node scripts/audit.imports.mjs',
  },
  {
    name: 'Ensure index.ts',
    cmd: 'node scripts/ensure.index-files.mjs',
  },
  {
    name: 'TypeScript Check',
    cmd: 'npx tsc --noEmit',
  },
  {
    name: 'ESLint Check',
    cmd: 'npx eslint src',
  },
];

console.log('🩺 HEALTHCHECK START\n');

for (const step of steps) {
  try {
    console.log(`▶ ${step.name}`);
    execSync(step.cmd, { stdio: 'inherit' });
    console.log('');
  } catch (err) {
    console.error(`❌ FAILED AT: ${step.name}`);
    process.exit(1);
  }
}

console.log('🎉 HEALTHCHECK PASSED — PROJECT IS CLEAN');
