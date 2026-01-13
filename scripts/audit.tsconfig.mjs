// scripts/audit.tsconfig.mjs
import ts from 'typescript';
import path from 'path';

const ROOT = process.cwd();
const TSCONFIG_PATH = path.join(ROOT, 'tsconfig.json');

console.log('🔍 AUDIT tsconfig.json\n');

const configFile = ts.readConfigFile(
  TSCONFIG_PATH,
  ts.sys.readFile
);

if (configFile.error) {
  console.error('❌ Failed to read tsconfig.json');
  console.error(
    ts.flattenDiagnosticMessageText(
      configFile.error.messageText,
      '\n'
    )
  );
  process.exit(1);
}

const parsed = ts.parseJsonConfigFileContent(
  configFile.config,
  ts.sys,
  ROOT
);

const compiler = parsed.options;
const errors = [];

/* ===============================
   REQUIRED INFRA OPTIONS
=============================== */

if (!compiler.baseUrl) {
  errors.push('compilerOptions.baseUrl is required');
}

if (!compiler.paths || Object.keys(compiler.paths).length === 0) {
  errors.push('compilerOptions.paths must be defined');
}

/* ===============================
   REQUIRED ALIASES
=============================== */

const requiredAliases = [
  '@app/*',
  '@modules/*',
  '@core/*',
  '@shared/*',
];

for (const alias of requiredAliases) {
  if (!compiler.paths?.[alias]) {
    errors.push(`Missing path alias: ${alias}`);
  }
}

if (errors.length > 0) {
  console.error('❌ tsconfig audit FAILED\n');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

console.log('✅ tsconfig.json infra rules OK');
console.log('\n🎉 TSCONFIG AUDIT PASSED');
