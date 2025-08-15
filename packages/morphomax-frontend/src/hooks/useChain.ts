import { useMemo, useState } from 'react';
import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { LITEVMChain } from '@lit-protocol/types';
import { ethers } from 'ethers';

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)'];

const USDC_CONTRACT_ADDRESSES: Record<number, string> = {
  [LIT_EVM_CHAINS.ethereum.chainId]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  [LIT_EVM_CHAINS.polygon.chainId]: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  [LIT_EVM_CHAINS.avalanche.chainId]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  [LIT_EVM_CHAINS.arbitrum.chainId]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [LIT_EVM_CHAINS.base.chainId]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  [LIT_EVM_CHAINS.baseSepolia.chainId]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  [LIT_EVM_CHAINS.optimism.chainId]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
};

export const useChain = () => {
  const [chain, setChain] = useState<LITEVMChain>(LIT_EVM_CHAINS.base);

  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(chain.rpcUrls[0]), [chain]);
  const usdcContract = useMemo(
    () => new ethers.Contract(USDC_CONTRACT_ADDRESSES[chain.chainId], ERC20_ABI, provider),
    [chain, provider]
  );

  return {
    chain,
    setChain,
    provider,
    usdcContract,
  };
};
