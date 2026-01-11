// Enhanced viem mock
export const http = () => ({ type: 'http' });
export const webSocket = () => ({ type: 'webSocket' });
export const createPublicClient = (config?: any) => ({
  ...config,
  type: 'publicClient',
  readContract: async () => ({}),
  getBalance: async () => BigInt(0),
  estimateGas: async () => BigInt(21000),
});
export const createWalletClient = (config?: any) => ({
  ...config,
  type: 'walletClient',
  sendTransaction: async () => '0x123',
  signMessage: async () => '0x456',
});
export const custom = (transport: any) => transport;
export const parseEther = (value: string) => BigInt(Math.floor(parseFloat(value) * 1e18));
export const formatEther = (value: bigint) => (Number(value) / 1e18).toString();

// Types
export type PublicClient = ReturnType<typeof createPublicClient>;
export type WalletClient = ReturnType<typeof createWalletClient>;
export type Transport = ReturnType<typeof http>;
export type Chain = {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    [key: string]: { http: string[] };
  };
};
export type Address = `0x${string}`;
export type Hash = `0x${string}`;
