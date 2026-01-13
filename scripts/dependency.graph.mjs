// scripts/dependency.graph.mjs
import fs from 'fs'
import path from 'path'

const SRC_DIR = path.resolve('src')

function walk(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file)
    if (fs.statSync(full).isDirectory()) {
      walk(full, files)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      files.push(full)
    }
  }
  return files
}

function detectLayer(file) {
  if (file.includes('/ui/')) return 'UI'
  if (file.includes('/modules/')) return 'MODULE'
  if (file.includes('/core/')) return 'CORE'
  if (file.includes('/shared/')) return 'SHARED'
  return 'UNKNOWN'
}

const files = walk(SRC_DIR)

console.log('\n📊 DEPENDENCY GRAPH (SIMPLE)\n')

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const imports = content.match(/from ['"](.*?)['"]/g) || []

  const fromLayer = detectLayer(file)

  imports.forEach((imp) => {
    const target = imp.replace(/from ['"]|['"]/g, '')
    if (!target.startsWith('@/')) return

    let toLayer = 'UNKNOWN'
    if (target.includes('/core')) toLayer = 'CORE'
    if (target.includes('/modules')) toLayer = 'MODULE'
    if (target.includes('/shared')) toLayer = 'SHARED'

    if (fromLayer === 'UI' && toLayer === 'CORE') {
      console.warn(`🚨 UI → CORE VIOLATION: ${file}`)
    }

    if (fromLayer === 'MODULE' && toLayer === 'MODULE' && !target.includes(path.basename(file))) {
      console.warn(`⚠️ MODULE → MODULE DIRECT: ${file}`)
    }
  })
}

console.log('\n✅ Dependency scan done\n')
