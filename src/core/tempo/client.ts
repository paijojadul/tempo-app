import { createPublicClient, http } from '../../core/tempo/mocks/viem';
type PublicClient = any; // Mock type
import { TEMPO_TESTNET } from './chains';
// src/core/tempo/client.ts

let client: PublicClient | null = null;

export function getTempoClient(): PublicClient {
  if (client) return client;

  client = createPublicClient({
    chain: {
      id: TEMPO_TESTNET.id,
      name: TEMPO_TESTNET.name,
      nativeCurrency: {
        name: 'Tempo',
        symbol: 'TEMPO',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.testnet.tempo.xyz'],
        },
      },
    },
    transport: http(),
  });

  return client;
}
