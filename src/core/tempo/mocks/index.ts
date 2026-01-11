// Clean index - NO duplicate exports
export { tempoModerato, TEMPO_TESTNET, getChainConfig } from './tempo-chains';
export {
  createConfig,
  http,
  createPublicClient,
  createWalletClient,
  custom,
  useAccount,
  useConnect,
  useDisconnect,
} from './wagmi';
export {
  http as viemHttp,
  createPublicClient as viemCreatePublicClient,
  createWalletClient as viemCreateWalletClient,
  custom as viemCustom,
  parseEther,
  formatEther,
} from './viem';
export { injected, walletConnect } from './connectors';
