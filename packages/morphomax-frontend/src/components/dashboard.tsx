import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RefreshCw, Wallet, StopCircle, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { JwtContext } from '@/contexts/jwt';
import { useBackend, Strategy } from '@/hooks/useBackend';
import { env } from '@/config/env';
import { Footer } from '@/components/shared/Footer';
import { Header } from '@/components/shared/Header';
import { WalletModal } from '@/components/WalletModal';
import { theme } from '@/components/theme';
import { useTheme } from '@/components/shared/useTheme';
import { useFetchUsdcBalance } from '@/hooks/useFetchUsdcBalance';
import { ApyDropdown } from '@/components/ApyDropdown';


export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [yieldData, setYieldData] = useState<Strategy | null>(null);
  const [yieldLoading, setYieldLoading] = useState(true);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [stoppingSchedule, setStoppingSchedule] = useState<string | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState<string | null>(null);
  const [showAgentInfo, setShowAgentInfo] = useState(false);
  
  const { createSchedule, getOptimalStrategyInfo, getSchedules, deleteSchedule } = useBackend();
  const { authInfo, logOut } = useContext(JwtContext);
  const { isDark, toggleTheme } = useTheme();

  // Check if user already has an active schedule
  const [hasActiveSchedule, setHasActiveSchedule] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);
  
  useEffect(() => {
    const checkSchedules = async () => {
      try {
        const schedulesData = await getSchedules();
        setSchedules(schedulesData);
        setHasActiveSchedule(schedulesData.some(s => !s.disabled));
      } catch (error) {
        console.error('Error checking schedules:', error);
      }
    };
    checkSchedules();
  }, [getSchedules]);

  // Fetch yield data
  useEffect(() => {
    const fetchYieldData = async () => {
      setYieldLoading(true);
      try {
        const strategy = await getOptimalStrategyInfo();
        setYieldData(strategy);
      } catch (error) {
        console.error('Error fetching yield data:', error);
      } finally {
        setYieldLoading(false);
      }
    };
    fetchYieldData();
  }, [getOptimalStrategyInfo]);

  const { balanceFormatted, isLoading: balanceLoading, error: balanceError, refetch: refetchBalance } = 
    useFetchUsdcBalance(authInfo?.pkp.ethAddress || '');

  const currentBalance = parseFloat(balanceFormatted || '0');
  const progressPercentage = (currentBalance / env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT) * 100;
  const amountNeeded = Math.max(0, env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT - currentBalance);

  const handleActivate = useCallback(async () => {
    setLoading(true);
    setActivationError(null);
    setLoadingStatus('Activating Vincent Yield...');
    
    try {
      await createSchedule();
      setLoadingStatus('Vincent Yield activated successfully!');
      
      // Refresh schedules immediately after creation
      const schedulesData = await getSchedules();
      setSchedules(schedulesData);
      setHasActiveSchedule(schedulesData.some(s => !s.disabled));
      
      setTimeout(() => {
        setLoadingStatus(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating Schedule:', error);
      setActivationError(error.message || 'Failed to activate Vincent Yield');
    } finally {
      setLoading(false);
    }
  }, [createSchedule, getSchedules]);

  const handleStopSchedule = useCallback(async (scheduleId: string) => {
    setStoppingSchedule(scheduleId);
    try {
      await deleteSchedule(scheduleId);
      setHasActiveSchedule(false);
      // Refresh schedules to update the UI
      const schedulesData = await getSchedules();
      setSchedules(schedulesData);
      setHasActiveSchedule(schedulesData.some(s => !s.disabled));
    } catch (error: any) {
      console.error('Error stopping schedule:', error);
      setActivationError(error.message || 'Failed to stop Vincent Yield');
    } finally {
      setStoppingSchedule(null);
    }
  }, [deleteSchedule, getSchedules]);



  if (!authInfo?.pkp.ethAddress) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        button[class*="absolute top-4 right-4"] {
          opacity: 0.15 !important;
        }
        button[class*="absolute top-4 right-4"]:hover {
          opacity: 0.4 !important;
        }
      `}</style>
      
      <div className={`w-[calc(100%-1rem)] max-w-xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl`}>
        <Header 
          title="Vincent Yield" 
          isDark={isDark} 
          onToggleTheme={toggleTheme}
          rightButton={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={logOut}
                className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
              >
                Log Out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWalletModal(true)}
                className={`${theme.text} hover:bg-white/10 px-2 sm:px-3`}
              >
                <Wallet className="w-4 h-4" />
              </Button>
            </>
          }
        />

        <div className={`px-3 sm:px-6 pt-6 pb-4 border-b ${theme.cardBorder}`}>
          <h1 className={`font-medium ${theme.text} text-center leading-tight`} style={{fontSize: '30px'}}>
            Vincent Yield Maximizer
          </h1>
          <div className="text-xs uppercase tracking-widest font-normal text-orange-500 text-center mt-1">
            EARLY ACCESS
          </div>
          <p className={`${theme.textMuted} text-sm text-center mt-2`}>
            Vincent powers the next wave of user-owned finance and agent-driven automation for Web3.
            Deposit at least 50 USDC <span className="text-orange-500">on Base Mainnet</span> to get
            started with Vincent Yield.
          </p>
          
          {/* Yield Information */}
          <div className="mt-3 flex justify-center">
            {yieldLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />
                <span className={`${theme.textMuted} text-xs font-medium tracking-wide`}>
                  Loading yield data...
                </span>
              </div>
            ) : yieldData?.state?.netApy ? (
              <ApyDropdown netApy={yieldData.state.netApy} strategyName={yieldData.name} />
            ) : (
              <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                  Yield Data:
                </span>
                <span className={`${theme.textMuted} text-xs`}>Unavailable</span>
              </div>
            )}
          </div>
        </div>

        {/* Agent Runtime Display */}
        {hasActiveSchedule && schedules.length > 0 && (
          <div className={`px-3 sm:px-6 py-4 border-t ${theme.cardBorder}`}>
            <div className="text-center">
              <div className="relative flex items-center justify-center gap-1 mb-3">
                <p className={`text-xs font-medium ${theme.text}`}>Agent Status</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAgentInfo(!showAgentInfo);
                  }}
                  className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200`}
                  title="Balance information"
                >
                  <Info className={`h-3 w-3 ${theme.textMuted} hover:${theme.text}`} />
                </button>
                
                {/* Agent Info Dropdown */}
                {showAgentInfo && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAgentInfo(false)} />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 z-50">
                      {/* Arrow pointing up */}
                      <div className="flex justify-center">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white dark:border-b-gray-800"></div>
                      </div>
                      
                      {/* Dropdown content */}
                      <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl shadow-lg overflow-hidden`} onClick={e => e.stopPropagation()}>
                      <div className="p-2 space-y-2">
                        <div>
                          <h3 className={`text-xs font-semibold ${theme.text} mb-0.5`}>Balance Info</h3>
                          <p className={`${theme.text} text-xs leading-snug`}>
                            Your wallet USDC on Base. Vault deposits won't appear here.
                          </p>
                        </div>

                        {/* BaseScan Link */}
                        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                          <p className={`text-[10px] font-medium ${theme.text} mb-0.5`}>View all assets:</p>
                          <a
                            href={`https://basescan.org/address/${authInfo?.pkp.ethAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                              {authInfo?.pkp.ethAddress?.slice(0, 6)}...{authInfo?.pkp.ethAddress?.slice(-4)}
                            </span>
                            <span>BaseScan</span>
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {schedules.map((schedule) => {
                const {
                  disabled,
                  lastFinishedAt,
                  failedAt,
                  _id: uniqueKey,
                  data: { updatedAt },
                } = schedule;

                if (disabled) return null;

                const lastRunAt = lastFinishedAt || failedAt || updatedAt;
                const failedAfterLastRun =
                  failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;
                const status = failedAfterLastRun ? 'Failed' : 'Active';
                
                // Calculate runtime since activation
                const activatedAt = new Date(updatedAt);
                const now = new Date();
                const diffMs = now.getTime() - activatedAt.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                let runtimeText = '';
                if (diffDays > 0) {
                  runtimeText = `${diffDays}d ${diffHours}h`;
                } else if (diffHours > 0) {
                  runtimeText = `${diffHours}h ${diffMinutes}m`;
                } else {
                  runtimeText = `${diffMinutes}m`;
                }

                return (
                  <div key={uniqueKey} className="space-y-3">
                    {/* Balance Display */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative">
                        <img src="/external-logos/usdc-coin-logo.svg" alt="USDC" className="w-7 h-7" />
                        <img
                          src="/external-logos/base-logo.svg"
                          alt="Base"
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white ring-1 ring-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`${theme.text} font-medium`} style={{ fontSize: 'clamp(0.875rem, 4vw, 1rem)' }}>
                          ${balanceFormatted || '0.00'} USDC
                        </span>
                        {balanceLoading ? (
                          <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />
                        ) : !balanceError ? (
                          <button
                            onClick={refetchBalance}
                            className={`p-1 ${theme.itemHoverBg} ${theme.textMuted} hover:${theme.text} transition-all duration-200`}
                            title="Refresh balance"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            onClick={refetchBalance}
                            className="text-red-500 hover:text-red-400 transition-colors"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Agent Status Card */}
                    <div className="bg-gradient-to-r from-orange-50 to-green-50 dark:from-orange-900/20 dark:to-green-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${theme.text}`}>Weekly Schedule</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            status === 'Active' ? 'text-green-600 dark:text-green-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {status}
                          </span>
                          {status === 'Active' && (
                            <div className="relative">
                              <button
                                onClick={() => setShowStopConfirmation(showStopConfirmation === uniqueKey ? null : uniqueKey)}
                                disabled={stoppingSchedule === uniqueKey}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                                title="Stop Vincent Yield"
                              >
                                {stoppingSchedule === uniqueKey ? (
                                  <RefreshCw className="h-3 w-3 text-red-500 animate-spin" />
                                ) : (
                                  <StopCircle className="h-3 w-3 text-red-500 hover:text-red-600" />
                                )}
                              </button>
                              
                              {/* Stop Confirmation Dropdown */}
                              {showStopConfirmation === uniqueKey && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setShowStopConfirmation(null)} />
                                  <div className="absolute bottom-full right-0 mb-2 w-48 z-50">
                                    {/* Arrow pointing down */}
                                    <div className="flex justify-end pr-2">
                                      <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
                                    </div>
                                    
                                    {/* Dropdown content */}
                                    <div className={`${theme.mainCard} border ${theme.mainCardBorder} rounded-xl shadow-lg overflow-hidden`} onClick={e => e.stopPropagation()}>
                                      <div className="p-2 space-y-2">
                                        <div>
                                          <p className={`${theme.text} text-xs leading-snug text-center`}>
                                            Stop Vincent Yield?
                                          </p>
                                        </div>
                                        
                                        <button
                                          onClick={() => {
                                            if (showStopConfirmation) {
                                              handleStopSchedule(showStopConfirmation);
                                              setShowStopConfirmation(null);
                                            }
                                          }}
                                          disabled={!!stoppingSchedule}
                                          className="w-full px-2 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                          {stoppingSchedule ? (
                                            <>
                                              <RefreshCw className="h-3 w-3 animate-spin" />
                                              Stopping...
                                            </>
                                          ) : (
                                            'Stop Agent'
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${theme.textMuted}`}>
                          Runtime: {runtimeText}
                        </span>
                        <span className={`${theme.textMuted}`}>
                          Last run: {new Date(lastRunAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasActiveSchedule && (
          <div className="px-3 sm:px-6 pt-2 pb-4 sm:pb-6">
            <div className="mt-2 sm:mt-3 pt-1 sm:pt-2">
                <div className="flex flex-col space-y-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`${theme.textMuted} font-medium`} style={{ fontSize: 'clamp(0.625rem, 3.5vw, 0.875rem)' }}>
                        Balance
                      </div>
                      {balanceLoading ? (
                        <div className="p-1">
                          <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />
                        </div>
                      ) : !balanceError ? (
                        <button
                          onClick={refetchBalance}
                          className={`p-1 ${theme.itemHoverBg} ${theme.textMuted} hover:${theme.text} transition-all duration-200`}
                          title="Refresh balance"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      ) : null}
                      {balanceError && (
                        <button
                          onClick={refetchBalance}
                          className="text-red-500 hover:text-red-400 font-normal transition-colors"
                          style={{ fontSize: 'clamp(0.75rem, 3vw, 0.875rem)' }}
                        >
                          Error - Retry
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src="/external-logos/usdc-coin-logo.svg" alt="USDC" className="w-7 h-7" />
                        <img
                          src="/external-logos/base-logo.svg"
                          alt="Base"
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white ring-1 ring-white"
                        />
                      </div>

                      {/* Progress Bar next to logo */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between" style={{ fontSize: 'clamp(0.5rem, 3vw, 0.75rem)' }}>
                          <span className={theme.textMuted}>
                            ${balanceFormatted || '0.00'} / ${env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT}.00 USDC
                          </span>
                          {currentBalance < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT && (
                            <span style={{
                              color: '#ff722c',
                              fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                            }}>
                              ${amountNeeded.toFixed(2)} needed
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.min(progressPercentage, 100)}%`,
                              backgroundColor: currentBalance >= env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ? '#fbbf24' : '#ff722c',
                              ...(currentBalance >= env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT && {
                                backgroundImage: 'linear-gradient(90deg, #fbbf24 0%, #ffffff60 50%, #fbbf24 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s linear infinite',
                              }),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {!hasActiveSchedule && (
          <div className="flex flex-col items-center py-4 sm:py-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Loading status */}
            {loading && loadingStatus && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 text-orange-500 animate-spin" />
                <span className={`${theme.textMuted} text-xs font-medium`}>{loadingStatus}</span>
              </div>
            )}

            {/* Error message */}
            {activationError && (
              <div className="text-red-500 text-xs text-center font-medium">{activationError}</div>
            )}

            <button
              onClick={handleActivate}
              disabled={
                !balanceFormatted ||
                parseFloat(balanceFormatted) < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ||
                loading
              }
              className="font-semibold tracking-wide transition-all duration-200 border text-white"
              style={{
                borderRadius: '0.5rem',
                fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                padding: 'clamp(0.375rem, 0.75vw, 0.5rem) clamp(1rem, 4vw, 2rem)',
                backgroundColor: 
                  !balanceFormatted ||
                  parseFloat(balanceFormatted) < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ||
                  loading
                    ? '#e5e7eb'
                    : '#f97316',
                borderColor:
                  !balanceFormatted ||
                  parseFloat(balanceFormatted) < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ||
                  loading
                    ? '#e5e7eb'
                    : '#f97316',
                color:
                  !balanceFormatted ||
                  parseFloat(balanceFormatted) < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ||
                  loading
                    ? '#9ca3af'
                    : '#ffffff',
                cursor:
                  !balanceFormatted ||
                  parseFloat(balanceFormatted) < env.VITE_VINCENT_YIELD_MINIMUM_DEPOSIT ||
                  loading
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {loading ? 'Activating...' : 'Activate Vincent Yield'}
            </button>
          </div>
        )}

        <Footer />
      </div>

      {/* Wallet Modal */}
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        walletAddress={authInfo?.pkp.ethAddress || ''}
      />


    </div>
  );
};