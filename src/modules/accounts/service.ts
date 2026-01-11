import { getTempoClient } from '../../core/tempo';

export interface AccountsItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
// Fix: Import getTempoClient dari index.ts bukan langsung client.ts
// TODO: Fix cross-module import

export async function fetchAccountsCount(): Promise<number> {
  console.log('🔍 Calling getTempoClient...');

  try {
    const client = getTempoClient();
    console.log('Tempo client initialized', client);
    console.log('✅ Tempo client created:', client);

    // // TODO: Implement real Tempo query here
    // For now, return mock data
    await new Promise((r) => setTimeout(r, 1000));
    return Math.floor(Math.random() * 99) + 1;
  } catch (error: any) {
    console.error('❌ Error with Tempo client:', error.message);
    // Fallback to mock data
    await new Promise((r) => setTimeout(r, 800));
    return Math.floor(Math.random() * 50) + 10;
  }
}

export async function resetAccountsCount(): Promise<number> {
  console.log('🔄 Resetting accounts count');
  return 0;
}

export async function fetchAccountsData() {
  try {
    const client = getTempoClient();
    // // TODO: Implement actual Tempo blockchain query
    console.log('Fetching accounts data...');

    await new Promise((resolve) => setTimeout(resolve, 300));

    return [
      {
        id: '1',
        name: 'Sample accounts Item',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  } catch (error) {
    console.error('Failed to fetch accounts data:', error);
    throw error;
  }
}
