import * as Sentry from '@sentry/react';
import { useState, useCallback, useEffect } from 'react';

import { useBackend } from '@/hooks/useBackend';

export function useFetchUsdcBalance() {
  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getScheduleBalances } = useBackend();

  const fetchBalance = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { investedAmountUsdc, uninvestedAmountUsdc } = await getScheduleBalances();
      const formatted = parseFloat(investedAmountUsdc) + parseFloat(uninvestedAmountUsdc);
      setBalanceFormatted(formatted.toFixed(2));
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to fetch balance');
      setBalanceFormatted('0.00');
      Sentry.captureException(err);
    } finally {
      setIsLoading(false);
    }
  }, [getScheduleBalances]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balanceFormatted, isLoading, error, refetch: fetchBalance };
}
