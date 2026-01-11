try {
  const tempo = require('tempo.ts');
  console.log('✅ tempo.ts bisa di-require');
  console.log('📦 Keys:', Object.keys(tempo).slice(0, 15));
  console.log('📊 Total keys:', Object.keys(tempo).length);

  // Cari fungsi yang mungkin berguna
  const functions = Object.keys(tempo).filter((k) => typeof tempo[k] === 'function');
  console.log('🔧 Functions:', functions.slice(0, 10));

  // Cek versi
  if (tempo.VERSION) {
    console.log('🎯 Version:', tempo.VERSION);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
