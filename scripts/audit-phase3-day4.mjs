import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('src')
const VIOLATIONS = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      walk(full)
    } else {
      const content = fs.readFileSync(full, 'utf8')

      // UI must not call RPC or service
      if (
        full.includes('/app/') ||
        full.includes('/pages/')
      ) {
        if (
          content.includes('tempoRequest') ||
          content.includes('/service')
        ) {
          VIOLATIONS.push(`UI violation: ${full}`)
        }
      }

      // Store must not call RPC
      if (full.includes('/store') && content.includes('tempoRequest')) {
        VIOLATIONS.push(`Store calling RPC: ${full}`)
      }
    }
  }
}

// Hard rule: mocks forbidden
const mocksPath = path.join(ROOT, 'core/tempo/mocks')
if (fs.existsSync(mocksPath)) {
  VIOLATIONS.push('Forbidden mocks directory still exists')
}

walk(ROOT)

if (VIOLATIONS.length) {
  console.error('❌ PHASE 3 DAY 4 AUDIT FAILED\n')
  VIOLATIONS.forEach(v => console.error('-', v))
  process.exit(1)
}

console.log('✅ PHASE 3 DAY 4 AUDIT PASSED')
console.log('RPC → Service → Store → UI is CLEAN')
