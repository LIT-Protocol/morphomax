import React from 'react';
import { ExternalLink, StopCircle, RefreshCw } from 'lucide-react';
import { theme } from '@/components/theme';
import { Button } from '@/components/ui/button';

interface FundsDeployedProps {
  /** Amount of funds deployed in USD */
  deployedAmount: string;
  /** Status of the deployment */
  status: 'Active' | 'Inactive' | 'Pending';
  /** Wallet address (will be truncated for display) */
  walletAddress: string;
  /** Base scan URL for the wallet address */
  baseScanUrl?: string;
  /** Callback for stop button click */
  onStop?: () => void;
  /** Whether stop action is in progress */
  stopping?: boolean;
  /** Show stop confirmation dropdown */
  showStopConfirmation?: boolean;
  /** Callback for stop confirmation toggle */
  onToggleStopConfirmation?: () => void;
  /** Callback when deposit button is clicked */
  onDepositClick?: () => void;
}

export const FundsDeployed: React.FC<FundsDeployedProps> = ({
  deployedAmount,
  status,
  walletAddress,
  baseScanUrl = `https://basescan.org/address/${walletAddress}`,
  onStop,
  stopping = false,
  showStopConfirmation = false,
  onToggleStopConfirmation,
  onDepositClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Active':
        return '#228B22'; // Green - matches our design system
      case 'Inactive':
        return '#9C9C9C'; // Grey - matches our design system
      case 'Pending':
        return '#FF4205'; // Orange - matches our design system
      default:
        return '#9C9C9C';
    }
  };

  return (
    <div
      className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl p-6 space-y-4 min-w-0 flex-1`}
    >
      {/* USDC/Base Header with Status and Stop */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/external-logos/usdc-coin-logo.svg" alt="USDC" className="w-8 h-8" />
            <img
              src="/external-logos/base-logo.svg"
              alt="Base"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white ring-2 ring-white"
            />
          </div>
          <div>
            <div
              className="font-semibold"
              style={{
                fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
                color: 'var(--footer-text-color, #121212)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
              }}
            >
              Base USDC
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="px-3 py-1 rounded-full text-sm font-medium"
            style={{
              backgroundColor: `${getStatusColor()}20`,
              color: getStatusColor(),
              fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
            }}
          >
            {status}
          </div>
          {status === 'Active' && (
            <div className="relative">
              <button
                onClick={onToggleStopConfirmation}
                disabled={stopping}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                title="Stop Vincent Yield"
              >
                {stopping ? (
                  <RefreshCw className="h-5 w-5 text-red-500 animate-spin" />
                ) : (
                  <StopCircle className="h-5 w-5 text-red-500 hover:text-red-600" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Funds Deployed */}
      <div className="space-y-1">
        <div
          className="text-sm font-medium"
          style={{
            fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
            color: '#9C9C9C',
          }}
        >
          Funds Deployed:
        </div>
        <div
          className="font-bold"
          style={{
            fontFamily: '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
            color: 'var(--footer-text-color, #121212)',
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          }}
        >
          ${deployedAmount} USDC
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="secondary-outline"
          size="sm"
          onClick={onDepositClick}
          className="px-2 py-1"
          style={{
            fontSize: '12px',
            padding: 'clamp(0.125rem, 0.3vw, 0.25rem) clamp(0.375rem, 0.75vw, 0.5rem)',
          }}
        >
          Deposit
        </Button>
        <a
          href={baseScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-colors"
          style={{
            color: '#FF4205',
            fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
          }}
        >
          <span>BaseScan</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Stop Confirmation Modal */}
      {showStopConfirmation && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50 rounded-2xl"
          onClick={onToggleStopConfirmation}
        >
          <div
            className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl max-w-sm w-full mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3
                  className={`${theme.text} text-lg font-semibold mb-2`}
                  style={{
                    fontFamily:
                      '"ITC Avant Garde Gothic", "Century Gothic", "Avantgarde", sans-serif',
                  }}
                >
                  Stop Vincent Yield?
                </h3>
                <p
                  className={`${theme.textMuted} text-sm`}
                  style={{
                    fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                  }}
                >
                  This will stop the automated yield optimization for your funds.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onToggleStopConfirmation}
                  disabled={stopping}
                  variant="secondary-outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onStop}
                  disabled={stopping}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  {stopping ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    'Stop Agent'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
