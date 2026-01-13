/**
 * =====================================================
 * FIX — PHASE 4 DAY 2
 * Standard Error Handling Bootstrap
 * =====================================================
 *
 * Tujuan:
 * - Memastikan struktur error core tersedia
 * - Aman dijalankan berkali-kali (idempotent)
 * - TIDAK menyentuh business logic
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const files = [
  {
    file: 'src/core/error/TempoError.ts',
    content: `export type TempoErrorCode =
  | 'UNKNOWN'
  | 'NETWORK'
  | 'RPC'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'VALIDATION';

export class TempoError extends Error {
  readonly code: TempoErrorCode;
  readonly cause?: unknown;

  constructor(
    code: TempoErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'TempoError';
    this.code = code;
    this.cause = cause;
  }
}
`,
  },
  {
    file: 'src/core/error/mapError.ts',
    content: `import { TempoError } from './TempoError';

export function mapError(error: unknown): TempoError {
  if (error instanceof TempoError) {
    return error;
  }

  if (error instanceof Error) {
    return new TempoError(
      'UNKNOWN',
      error.message || 'Unknown error',
      error
    );
  }

  return new TempoError(
    'UNKNOWN',
    'Non-error thrown',
    error
  );
}
`,
  },
  {
    file: 'src/core/tempo/safeCall.ts',
    content: `import { mapError } from '../error/mapError';
import { TempoError } from '../error/TempoError';

export async function safeCall<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const mapped: TempoError = mapError(err);
    throw mapped;
  }
}
`,
  },
];

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(relativePath, content) {
  const fullPath = path.join(ROOT, relativePath);
  ensureDir(fullPath);

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✔ fixed: ${relativePath}`);
}

console.log('🚧 Running FIX — PHASE 4 DAY 2...\n');

for (const f of files) {
  writeFileSafe(f.file, f.content);
}

console.log('\n✅ PHASE 4 DAY 2 bootstrap complete.');
console.log('👉 Next: integrate safeCall usage (DAY 3)');
