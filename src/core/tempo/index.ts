// Core Tempo module exports
export * from './chains';
export * from './client';
export * from './wallet';

// Re-export commonly used items with explicit names
export { getTempoClient } from './client';
export { TEMPO_TESTNET } from './chains';
export { connectWallet } from './wallet';
