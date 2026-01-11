import { execSync } from 'node:child_process';

console.log('Installing tempo-ts SDK from GitHub...');

execSync('pnpm add github:tempoxyz/tempo-ts', { stdio: 'inherit' });

console.log('tempo-ts installed successfully');
