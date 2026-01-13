#!/usr/bin/env node
/**
 * PHASE 3 — DAY 5
 * REAL RPC VALIDATION (MANUAL)
 *
 * ❌ NO parsing
 * ❌ NO semantics
 * ❌ NO refactor
 * ✅ RAW logging only
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { tempoRequest } from '../src/core/tempo/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SNAPSHOT_DIR = path.join(__dirname, '../snapshots/phase3-day5');

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function saveSnapshot(name, data) {
  const file = path.join(
    SNAPSHOT_DIR,
    `${name}-${Date.now()}.json`
  );
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`📸 Snapshot saved: ${path.basename(file)}`);
}

async function testDexGetOrders() {
  console.log('\n🧪 Testing dex_getOrders');

  const response = await tempoRequest(
    'dex_getOrders',
    {
      limit: 5
    }
  );

  console.log('RAW RESPONSE:', response);
  saveSnapshot('dex_getOrders', response);
}

async function testDexGetOrderbooks() {
  console.log('\n🧪 Testing dex_getOrderbooks');

  const response = await tempoRequest(
    'dex_getOrderbooks',
    {
      limit: 5
    }
  );

  console.log('RAW RESPONSE:', response);
  saveSnapshot('dex_getOrderbooks', response);
}

async function main() {
  console.log('🌐 PHASE 3 DAY 5 — REAL RPC TEST START');

  try {
    await testDexGetOrders();
    await testDexGetOrderbooks();

    console.log('\n✅ PHASE 3 DAY 5 — RPC TEST COMPLETED');
    console.log('⚠️  No parsing, no interpretation performed');
  } catch (err) {
    console.error('\n❌ RPC TEST FAILED');
    console.error(err);
    process.exit(1);
  }
}

main();
