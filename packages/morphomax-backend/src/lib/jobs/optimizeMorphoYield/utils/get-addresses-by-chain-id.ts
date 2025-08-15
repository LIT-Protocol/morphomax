import { LIT_EVM_CHAINS } from '@lit-protocol/constants';

export type AddressSet = {
  USDC_ADDRESS: string;
};

// TODO clean and make type-safe
const addressMap: Record<number, AddressSet> = {
  [LIT_EVM_CHAINS.ethereum.chainId]: { USDC_ADDRESS: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  [LIT_EVM_CHAINS.polygon.chainId]: { USDC_ADDRESS: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359' },
  [LIT_EVM_CHAINS.avalanche.chainId]: {
    USDC_ADDRESS: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  },
  [LIT_EVM_CHAINS.arbitrum.chainId]: { USDC_ADDRESS: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
  [LIT_EVM_CHAINS.base.chainId]: { USDC_ADDRESS: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  [LIT_EVM_CHAINS.baseSepolia.chainId]: {
    USDC_ADDRESS: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  [LIT_EVM_CHAINS.optimism.chainId]: { USDC_ADDRESS: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
};

export const getAddressesByChainId = (chainId: keyof typeof addressMap): AddressSet => {
  const addresses = addressMap[chainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
};
