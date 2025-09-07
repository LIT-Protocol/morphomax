import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme } from '@/components/theme';

interface BalanceProps {
  /** Current balance formatted as a string */
  balanceFormatted?: string;
  /** Minimum deposit required */
  minimumDeposit: number;
  /** Whether balance is currently loading */
  balanceLoading?: boolean;
  /** Balance error message if any */
  balanceError?: string | null;
  /** Whether deposit is complete (balance >= minimum) */
  depositComplete?: boolean;
  /** Amount needed to reach minimum deposit */
  amountNeeded?: number;
  /** Progress percentage (0-100) */
  progressPercentage?: number;
  /** Callback to refresh balance */
  onRefreshBalance?: () => void;
  /** Callback when deposit button is clicked */
  onDepositClick?: () => void;
}

export const Balance: React.FC<BalanceProps> = ({
  balanceFormatted = '0.00',
  minimumDeposit,
  balanceLoading = false,
  balanceError = null,
  depositComplete = false,
  amountNeeded = 0,
  progressPercentage = 0,
  onRefreshBalance,
  onDepositClick,
}) => {
  return (
    <div className="flex flex-col space-y-2">
      {/* Header with Balance title and Deposit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`${theme.textMuted} font-medium`}
            style={{ fontSize: 'clamp(0.625rem, 3.5vw, 0.875rem)' }}
          >
            Balance
          </div>
          {balanceLoading ? (
            <div className="p-1">
              <RefreshCw className="h-3 w-3 animate-spin" style={{ color: '#ff4205' }} />
            </div>
          ) : !balanceError ? (
            <button
              onClick={onRefreshBalance}
              className={`p-1 ${theme.itemHoverBg} ${theme.textMuted} hover:${theme.text} transition-all duration-200`}
              title="Refresh balance"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          ) : null}
          {balanceError && (
            <button
              onClick={onRefreshBalance}
              className="text-red-500 hover:text-red-400 font-normal transition-colors"
              style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}
            >
              Error - Retry
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="secondary-outline"
          size="sm"
          onClick={onDepositClick}
          className="px-2 py-1"
          style={{
            fontSize: 'clamp(0.5rem, 2vw, 0.625rem)',
            padding: 'clamp(0.25rem, 0.5vw, 0.375rem) clamp(0.5rem, 1vw, 0.75rem)',
          }}
        >
          Deposit USDC
        </Button>
      </div>

      {/* Balance details */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src="/external-logos/usdc-coin-logo.svg" alt="USDC" className="w-7 h-7" />
          <img
            src="/external-logos/base-logo.svg"
            alt="Base"
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white ring-1 ring-white"
          />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex justify-between" style={{ fontSize: 'clamp(0.5rem, 3vw, 0.75rem)' }}>
            <span
              className={theme.textMuted}
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: '#9C9C9C',
              }}
            >
              ${balanceFormatted} / ${minimumDeposit.toFixed(2)} USDC
            </span>
            {!depositComplete && (
              <span
                style={{
                  color: '#ff722c',
                  fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                  fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                }}
              >
                ${amountNeeded.toFixed(2)} needed
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(progressPercentage, 100)}%`,
                backgroundColor: depositComplete ? '#fbbf24' : '#ff722c',
                ...(depositComplete && {
                  backgroundImage:
                    'linear-gradient(90deg, #fbbf24 0%, #ffffff60 50%, #fbbf24 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                }),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
