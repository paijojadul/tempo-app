#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const gitDir = '.git';
const hooksDir = join(gitDir, 'hooks');
const hookFile = join(hooksDir, 'pre-push');

if (!existsSync(gitDir)) {
  console.error('❌ .git folder not found (not a git repo)');
  process.exit(1);
}

if (!existsSync(hooksDir)) {
  mkdirSync(hooksDir);
}

const hookContent = `#!/bin/sh
echo "🩺 Running healthcheck before push..."
node scripts/healthcheck.mjs

if [ $? -ne 0 ]; then
  echo "❌ Push blocked: healthcheck failed"
  exit 1
fi

echo "✅ Healthcheck passed — pushing allowed"
`;

writeFileSync(hookFile, hookContent);
chmodSync(hookFile, 0o755);

console.log('🔒 pre-push hook installed successfully');
