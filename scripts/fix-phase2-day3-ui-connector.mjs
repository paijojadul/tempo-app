// scripts/fix-phase2-day3-ui-connector.mjs
import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

console.log('🔌 PHASE 2 — DAY 3 UI CONNECTOR AUDIT\n')

if (!fs.existsSync(MODULES_DIR)) {
  console.error('❌ src/modules tidak ditemukan')
  process.exit(1)
}

const modules = fs
  .readdirSync(MODULES_DIR)
  .filter((name) =>
    fs.statSync(path.join(MODULES_DIR, name)).isDirectory()
  )

let hasError = false

for (const mod of modules) {
  const uiPath = path.join(MODULES_DIR, mod, 'ui.tsx')

  if (!fs.existsSync(uiPath)) {
    console.warn(`⚠️  [${mod}] ui.tsx tidak ditemukan`)
    continue
  }

  const content = fs.readFileSync(uiPath, 'utf-8')

  const hasStoreImport =
    content.includes('use' + capitalize(mod) + 'Store') ||
    content.includes('useStore')

  const hasUseEffect = content.includes('useEffect')
  const hasLoadingCheck =
    content.includes('loading') &&
    content.includes('Loading')

  console.log(`▶ MODULE: ${mod}`)

  if (!hasStoreImport) {
    console.log('  ❌ Tidak terhubung ke store')
    hasError = true
  } else {
    console.log('  ✅ Store terhubung')
  }

  if (!hasUseEffect) {
    console.log('  ❌ Tidak ada useEffect (load on mount)')
    hasError = true
  } else {
    console.log('  ✅ useEffect ditemukan')
  }

  if (!hasLoadingCheck) {
    console.log('  ⚠️  Loading state belum jelas (boleh minimal)')
  } else {
    console.log('  ✅ Loading state ada')
  }

  console.log('')
}

if (hasError) {
  console.log('❌ PHASE 2 DAY 3 BELUM HIJAU')
  process.exit(1)
}

console.log('🎉 PHASE 2 DAY 3 — UI CONNECTOR SIAP (AMAN)')
process.exit(0)

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
