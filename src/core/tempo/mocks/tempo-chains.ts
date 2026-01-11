// Clean tempo chains mock
export const tempoModerato = {
  id: 42429,
  name: 'Tempo Testnet',
  network: 'tempo',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.tempo.xyz'] },
    default: { http: ['https://rpc.testnet.tempo.xyz'] },
  },
};

export const TEMPO_TESTNET = tempoModerato;
export const getChainConfig = () => tempoModerato;
