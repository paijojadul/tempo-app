#!/usr/bin/env node
/**
 * FIX SCRIPT — PHASE 1 DAY 3
 * Store Skeleton (Minimal, Safe, Idempotent)
 */

import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

if (!fs.existsSync(MODULES_DIR)) {
  console.error('❌ src/modules not found')
  process.exit(1)
}

const modules = fs
  .readdirSync(MODULES_DIR)
  .filter((name) =>
    fs.statSync(path.join(MODULES_DIR, name)).isDirectory()
  )

console.log('🛠️ FIX DAY 3 — STORE SKELETON\n')

for (const moduleName of modules) {
  const storePath = path.join(
    MODULES_DIR,
    moduleName,
    'store.ts'
  )

  if (!fs.existsSync(storePath)) {
    console.log(`⚠️  ${moduleName}: store.ts not found, skipped`)
    continue
  }

  const existing = fs.readFileSync(storePath, 'utf8')

  // Kalau sudah ada pattern status idle → jangan sentuh
  if (existing.includes("status: 'idle'")) {
    console.log(`✅ ${moduleName}: store skeleton already OK`)
    continue
  }

  const Pascal =
    moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

  const content = `import { create } from 'zustand'

type ${Pascal}State = {
  status: 'idle'
}

export const use${Pascal}Store = create<${Pascal}State>(() => ({
  status: 'idle',
}))
`

  fs.writeFileSync(storePath, content, 'utf8')
  console.log(`🔧 ${moduleName}: store.ts fixed`)
}

console.log('\n🎉 DAY 3 STORE SKELETON DONE')
