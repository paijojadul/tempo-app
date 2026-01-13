#!/usr/bin/env node
/**
 * AUDIT PHASE 2 — INTERNAL LOGIC (STATE & FLOW)
 *
 * Rules enforced:
 * 1. UI ❌ import service / core
 * 2. Service ❌ import store / UI
 * 3. Store ❌ import UI
 * 4. No cross-module imports
 * 5. Naming consistency: fetchX / loadX / plural state
 *
 * This script FAILS HARD on violation.
 */

import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(process.cwd(), 'src/modules')

if (!fs.existsSync(ROOT)) {
  console.error('❌ src/modules not found')
  process.exit(1)
}

const violations = []

function read(file) {
  return fs.readFileSync(file, 'utf-8')
}

function scanImports(filePath, content) {
  const lines = content.split('\n')
  return lines
    .filter(l => l.startsWith('import'))
    .map(l => ({ filePath, line: l }))
}

function isCrossModuleImport(from, line) {
  if (!line.includes('modules/')) return false
  const fromModule = from.split('modules/')[1].split('/')[0]
  const importedModule = line.split('modules/')[1].split('/')[0]
  return fromModule !== importedModule
}

const modules = fs.readdirSync(ROOT).filter(d =>
  fs.statSync(path.join(ROOT, d)).isDirectory()
)

for (const moduleName of modules) {
  const modulePath = path.join(ROOT, moduleName)

  const ui = path.join(modulePath, 'ui.tsx')
  const store = path.join(modulePath, 'store.ts')
  const service = path.join(modulePath, 'service.ts')

  if (fs.existsSync(ui)) {
    const imports = scanImports(ui, read(ui))
    for (const { line } of imports) {
      if (line.includes('/service')) {
        violations.push(`❌ UI imports service in ${moduleName}`)
      }
      if (line.includes('/core')) {
        violations.push(`❌ UI imports core in ${moduleName}`)
      }
    }
  }

  if (fs.existsSync(store)) {
    const imports = scanImports(store, read(store))
    for (const { line } of imports) {
      if (line.includes('/ui')) {
        violations.push(`❌ Store imports UI in ${moduleName}`)
      }
      if (isCrossModuleImport(store, line)) {
        violations.push(`❌ Cross-module import in store (${moduleName})`)
      }
    }

    // Naming check: loadX
    const storeContent = read(store)
    if (!storeContent.match(/load[A-Z]/)) {
      violations.push(`⚠️ Store has no loadX action in ${moduleName}`)
    }
  }

  if (fs.existsSync(service)) {
    const imports = scanImports(service, read(service))
    for (const { line } of imports) {
      if (line.includes('/store')) {
        violations.push(`❌ Service imports store in ${moduleName}`)
      }
      if (line.includes('/ui')) {
        violations.push(`❌ Service imports UI in ${moduleName}`)
      }
      if (isCrossModuleImport(service, line)) {
        violations.push(`❌ Cross-module import in service (${moduleName})`)
      }
    }

    // Naming check: fetchX
    const serviceContent = read(service)
    if (!serviceContent.match(/fetch[A-Z]/)) {
      violations.push(`⚠️ Service has no fetchX function in ${moduleName}`)
    }
  }
}

if (violations.length) {
  console.error('\n🚨 PHASE 2 AUDIT FAILED\n')
  violations.forEach(v => console.error(v))
  console.error('\n❌ Phase 2 is NOT compliant\n')
  process.exit(1)
}

console.log('✅ PHASE 2 AUDIT PASSED — STATE & FLOW VALID')
