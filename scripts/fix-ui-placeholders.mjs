import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

const PLACEHOLDER_TEMPLATE = (name) => `export function ${name}UI() {
  return <div>${name} Module</div>
}
`

function pascalCase(str) {
  return str
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')
}

console.log('🛠️  FIX UI PLACEHOLDERS — DAY 2 MODE\n')

const modules = fs.readdirSync(MODULES_DIR)

for (const moduleName of modules) {
  const modulePath = path.join(MODULES_DIR, moduleName)
  const stat = fs.statSync(modulePath)

  if (!stat.isDirectory()) continue

  const uiFile = path.join(modulePath, 'ui.tsx')
  if (!fs.existsSync(uiFile)) continue

  const componentName = pascalCase(moduleName)

  fs.writeFileSync(uiFile, PLACEHOLDER_TEMPLATE(componentName), 'utf-8')

  console.log(`✅ RESET: ${moduleName}/ui.tsx`)
}

console.log('\n🎉 UI PLACEHOLDERS FIXED — SAFE TO CONTINUE')
