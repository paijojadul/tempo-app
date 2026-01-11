// Test 1: Import dari root
import * as tempo from 'tempo.ts';
console.log('Import dari root:', Object.keys(tempo).slice(0, 5));

// Test 2: Coba cek isi package
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules/tempo.ts/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
console.log('\nPackage exports:', JSON.stringify(pkg.exports, null, 2));

// Test 3: Cek apakah ada file chains
const srcDir = path.join(__dirname, 'node_modules/tempo.ts/src');
const files = fs.readdirSync(srcDir);
console.log('\nFiles in src:', files);
