import * as tempo from '../../core/tempo/mocks/tempo-chains'; // Mock for tempo.ts;

console.log('=== CEK TEMPO.TS ===');
console.log('Total ekspor:', Object.keys(tempo).length);

// Cari fungsi/class penting
const importantExports = Object.keys(tempo).filter(
  (key) =>
    key.includes('Client') ||
    key.includes('Provider') ||
    key.includes('Wallet') ||
    key.includes('Account')
);

console.log('Ekspor penting:', importantExports);

// Cek tipe
console.log('\n=== TIPE DATA ===');
importantExports.forEach((key) => {
  const value = (tempo as any)[key];
  console.log(`${key}:`, typeof value);
});

// Cek versi
if ('VERSION' in tempo) {
  console.log('\n✅ VERSI:', (tempo as any).VERSION);
}
