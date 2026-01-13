#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const SRC = path.resolve('src/modules')
let failed = false

const bannedInStore = ['fetch\\(', 'axios', 'useEffect']
const bannedInUI = ['fetch\\(', 'axios', 'service\\.']
const bannedInService = ['use.*Store']

function ok(msg) {
  console.log(`✅ ${msg}`)
}

function fail(msg) {
  console.log(`❌ ${msg}`)
  failed = true
}

function has(file, pattern) {
  const c = fs.readFileSync(file, 'utf-8')
  return new RegExp(pattern).test(c)
}

console.log('\n🩺 PHASE 2 AUDIT v2 START\n')

for (const mod of fs.readdirSync(SRC)) {
  const base = path.join(SRC, mod)
  if (!fs.statSync(base).isDirectory()) continue

  console.log(`▶ MODULE: ${mod}`)

  const store = path.join(base, 'store.ts')
  const service = path.join(base, 'service.ts')
  const ui = path.join(base, 'ui.tsx')

  // STORE
  if (!fs.existsSync(store)) {
    fail('store.ts missing')
  } else if (bannedInStore.some(p => has(store, p))) {
    fail('Store has forbidden logic')
  } else {
    ok('Store OK (Phase 2 Day 1)')
  }

  // SERVICE
  if (!fs.existsSync(service)) {
    fail('service.ts missing')
  } else if (bannedInService.some(p => has(service, p))) {
    fail('Service imports store (FORBIDDEN)')
  } else {
    ok('Service OK (Phase 2 Day 2)')
  }

  // UI
  if (!fs.existsSync(ui)) {
    fail('ui.tsx missing')
  } else if (bannedInUI.some(p => has(ui, p))) {
    fail('UI has forbidden logic')
  } else {
    ok('UI OK (Phase 2 Day 3)')
  }

  console.log('')
}

console.log('────────────────────────────')

if (failed) {
  console.log('❌ PHASE 2 AUDIT FAILED')
  process.exit(1)
} else {
  console.log('🎉 PHASE 2 AUDIT PASSED (REALISTIC)')
  process.exit(0)
}
