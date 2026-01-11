// Clean wagmi mock
export const createConfig = () => ({});
export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});

// Simple hooks for TypeScript
export const useAccount = () => ({ address: undefined, isConnected: false });
export const useConnect = () => ({ connect: async () => {} });
export const useDisconnect = () => ({ disconnect: async () => {} });
