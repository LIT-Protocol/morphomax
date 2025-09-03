import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { env } from '@/config/env';

const USDC_CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

// Create a singleton provider instance to reuse across all hook instances
let providerInstance: ethers.providers.JsonRpcProvider | null = null;
const getProvider = () => {
  if (!providerInstance) {
    providerInstance = new ethers.providers.JsonRpcProvider(
      env.VITE_VINCENT_BASE_RPC || 'https://mainnet.base.org'
    );
  }
  return providerInstance;
};

export function useFetchUsdcBalance(address: string) {
  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !ethers.utils.isAddress(address)) {
      setError('Invalid address');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider);
      const [balance, decimals] = await Promise.all([
        usdcContract.balanceOf(address),
        usdcContract.decimals(),
      ]);
      const formatted = ethers.utils.formatUnits(balance, decimals);
      setBalanceFormatted(parseFloat(formatted).toFixed(2));
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch balance');
      setBalanceFormatted('0.00');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balanceFormatted, isLoading, error, refetch: fetchBalance };
}
