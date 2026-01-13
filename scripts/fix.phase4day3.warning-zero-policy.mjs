#!/usr/bin/env node
import { execSync } from 'node:child_process'

console.log('\n🧩 PHASE 4 — DAY 3: WARNING ZERO POLICY (CLI MODE)\n')

try {
  execSync(
    'npx eslint "src/**/*.{ts,tsx,js,jsx}" --fix',
    { stdio: 'inherit' }
  )

  console.log('\n🟢 ESLint CLI selesai dijalankan')

  console.log('\n📌 LANGKAH VERIFIKASI:')
  console.log('Jalankan: npx eslint "src/**/*.{ts,tsx,js,jsx}"\n')

} catch (err) {
  console.error('\n❌ ESLint menemukan ERROR atau WARNING')
  process.exit(1)
}
