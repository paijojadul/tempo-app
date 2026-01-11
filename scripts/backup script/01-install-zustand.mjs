#!/usr/bin/env node

import { execSync } from 'node:child_process';

console.log('Installing zustand with pnpm...');

execSync('pnpm add zustand', {
  stdio: 'inherit',
});

console.log('Zustand installed.');
