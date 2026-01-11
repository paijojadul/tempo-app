import { getTempoClient } from '../../core/tempo';

export interface TransactionsItem {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
// TODO: Fix cross-module // TODO: Fix cross-module import

export async function fetchTransactionsData() {
  // Access Tempo blockchain here

  const client = getTempoClient();
  // TODO: Use client for blockchain operations
  console.log('Transaction client:', client);
  // TODO: Use client for blockchain operations
  console.log('Transaction client:', client);

  // Implement your logic
  await new Promise((resolve) => setTimeout(resolve, 300));

  return [
    {
      id: '1',
      name: 'Sample transactions Item',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

export async function createTransactionsItem(data: { name: string }) {
  // Access Tempo blockchain here
  const client = getTempoClient();
  // TODO: Use client for blockchain operations
  console.log('Transaction client:', client);
  // TODO: Use client for blockchain operations
  console.log('Transaction client:', client);

  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: Date.now().toString(),
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
