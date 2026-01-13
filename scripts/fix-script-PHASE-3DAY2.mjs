#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const CORE_TEMPO_DIR = path.join(ROOT, 'src/core/tempo')

const DOMAINS = [
  'accounts',
  'exchange',
  'issuance',
  'payments',
  'transactions',
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 created: ${dir}`)
  }
}

function writeFileIfNotExists(filePath, content) {
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  skip (exists): ${path.relative(ROOT, filePath)}`)
    return
  }
  fs.writeFileSync(filePath, content)
  console.log(`✅ created: ${path.relative(ROOT, filePath)}`)
}

function template(domain) {
  const pascal =
    domain.charAt(0).toUpperCase() + domain.slice(1)

  return `import { tempoRequest } from './client'
import type { ${pascal} } from '../../modules/${domain}/types'

/**
 * CORE ENDPOINT WRAPPER
 * Domain: ${domain}
 * Phase: 3 Day 2
 * Rule:
 * - NO store import
 * - NO UI import
 * - NO state handling
 * - NO business logic
 */

export async function get${pascal}(): Promise<${pascal}[]> {
  return tempoRequest<${pascal}[]>('/${domain}')
}
`
}

function updateIndex(domains) {
  const indexPath = path.join(CORE_TEMPO_DIR, 'index.ts')

  let content = ''
  if (fs.existsSync(indexPath)) {
    content = fs.readFileSync(indexPath, 'utf-8')
  }

  const exports = domains
    .map((d) => `export * from './${d}'`)
    .filter((line) => !content.includes(line))

  if (exports.length === 0) {
    console.log('⏭️  core/tempo/index.ts already up to date')
    return
  }

  const finalContent =
    content.trimEnd() + '\n' + exports.join('\n') + '\n'

  fs.writeFileSync(indexPath, finalContent)
  console.log('🧩 updated: src/core/tempo/index.ts')
}

/* ===========================
   EXECUTION
=========================== */

console.log('🚀 PHASE 3 DAY 2 — CORE ENDPOINT WRAPPER')
console.log('--------------------------------------')

ensureDir(CORE_TEMPO_DIR)

for (const domain of DOMAINS) {
  const filePath = path.join(CORE_TEMPO_DIR, `${domain}.ts`)
  writeFileIfNotExists(filePath, template(domain))
}

updateIndex(DOMAINS)

console.log('--------------------------------------')
console.log('✅ DONE — Phase 3 Day 2 scaffolding safe')
console.log('👉 Next: update service.ts (Day 3)')
