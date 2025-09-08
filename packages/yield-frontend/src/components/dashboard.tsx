import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { JwtContext } from '@/contexts/jwt';
import { useBackend, Strategy, Schedule } from '@/hooks/useBackend';
import { env } from '@/config/env';
import { Footer } from '@/components/ui/footer';
import { Header } from '@/components/ui/header';
import { PageHeader } from '@/components/ui/page-header';
import { WalletModal } from '@/components/WalletModal';
import { theme } from '@/components/theme';
import { useTheme } from '@/components/shared/useTheme';
import { useFetchUsdcBalance } from '@/hooks/useFetchUsdcBalance';
import { ApyDropdown } from '@/components/ApyDropdown';
import { Balance } from '@/components/ui/balance';
import { FundsDeployed } from '@/components/ui/funds-deployed';
import { FAQ, faqData } from '@/components/ui/faq';

const { VITE_VINCENT_YIELD_MINIMUM_DEPOSIT } = env;

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [yieldData, setYieldData] = useState<Strategy | null>(null);
  const [yieldLoading, setYieldLoading] = useState(true);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [stoppingSchedule, setStoppingSchedule] = useState<string | null>(null);
  const [showStopConfirmation, setShowStopConfirmation] = useState<string | null>(null);

  const { createSchedule, getOptimalStrategyInfo, getSchedules, deleteSchedule } = useBackend();
  const { authInfo, logOut } = useContext(JwtContext);
  const { isDark, toggleTheme } = useTheme();

  // Check if user already has an active schedule
  const [hasActiveSchedule, setHasActiveSchedule] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    const checkSchedules = async () => {
      try {
        const schedulesData = await getSchedules();
        setSchedules(schedulesData);
        setHasActiveSchedule(schedulesData.some((s) => !s.disabled));
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

  const {
    balanceFormatted,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useFetchUsdcBalance(authInfo?.pkp.ethAddress || '');

  const currentBalance = parseFloat(balanceFormatted || '0');
  const progressPercentage = (currentBalance / VITE_VINCENT_YIELD_MINIMUM_DEPOSIT) * 100;
  const amountNeeded = Math.max(0, VITE_VINCENT_YIELD_MINIMUM_DEPOSIT - currentBalance);
  const depositComplete = currentBalance >= VITE_VINCENT_YIELD_MINIMUM_DEPOSIT;

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
      setHasActiveSchedule(schedulesData.some((s) => !s.disabled));

      setTimeout(() => {
        setLoadingStatus(null);
      }, 2000);
    } catch (error: unknown) {
      console.error('Error creating Schedule:', error);
      setActivationError(
        error instanceof Error ? error.message : 'Failed to activate Vincent Yield'
      );
    } finally {
      setLoading(false);
    }

    refetchBalance();
  }, [createSchedule, getSchedules, refetchBalance]);

  const handleStopSchedule = useCallback(
    async (scheduleId: string) => {
      setStoppingSchedule(scheduleId);
      try {
        await deleteSchedule(scheduleId);
        setHasActiveSchedule(false);
        // Refresh schedules to update the UI
        const schedulesData = await getSchedules();
        setSchedules(schedulesData);
        setHasActiveSchedule(schedulesData.some((s) => !s.disabled));
      } catch (error: unknown) {
        console.error('Error stopping schedule:', error);
        setActivationError(error instanceof Error ? error.message : 'Failed to stop Vincent Yield');
      } finally {
        setStoppingSchedule(null);
      }

      refetchBalance();
    },
    [deleteSchedule, getSchedules, refetchBalance]
  );

  if (!authInfo?.pkp.ethAddress) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
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

      <div
        className={`w-[calc(100%-1rem)] max-w-xl mx-auto ${theme.mainCard} border ${theme.mainCardBorder} rounded-2xl shadow-2xl relative z-10`}
      >
        <Header
          title="Vincent Yield"
          isDark={isDark}
          onToggleTheme={toggleTheme}
          rightButton={
            <>
              <Link to="/metrics">
                <Button variant="secondary-outline" size="sm" className="px-2 sm:px-3 mr-1">
                  Metrics
                </Button>
              </Link>
              <Button
                variant="secondary-outline"
                size="sm"
                onClick={logOut}
                className="px-2 sm:px-3"
              >
                Log Out
              </Button>
            </>
          }
        />

        <div className={`pt-5 pb-3 border-b ${theme.cardBorder}`}>
          <PageHeader
            title="Vincent Yield Agent"
            subtitle="EARLY ACCESS"
            description={
              <>
                This app uses the Vincent platform to securely and verifiably auto-rotate your Base
                USDC into top yield opportunities on Morpho.
              </>
            }
            size="lg"
          />
        </div>

        <div className={`px-3 sm:px-6 py-6`}>
          {/* Yield Information */}
          <div className="flex justify-center">
            {yieldLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" style={{ color: '#ff4205' }} />
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
            {schedules.map((schedule) => {
              const {
                disabled,
                lastFinishedAt,
                failedAt,
                _id: uniqueKey,
                investedAmountUsdc,
                uninvestedAmountUsdc,
              } = schedule;

              if (disabled) return null;

              const failedAfterLastRun =
                failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;
              const status = failedAfterLastRun ? 'Inactive' : 'Active';

              return (
                <div key={uniqueKey} className="space-y-3">
                  <FundsDeployed
                    deployedAmount={(
                      parseFloat(uninvestedAmountUsdc) + parseFloat(investedAmountUsdc)
                    ).toFixed(2)}
                    status={status}
                    walletAddress={authInfo?.pkp.ethAddress || ''}
                    onStop={() => {
                      if (showStopConfirmation) {
                        handleStopSchedule(showStopConfirmation);
                        setShowStopConfirmation(null);
                      }
                    }}
                    stopping={stoppingSchedule === uniqueKey}
                    showStopConfirmation={showStopConfirmation === uniqueKey}
                    onToggleStopConfirmation={() =>
                      setShowStopConfirmation(showStopConfirmation === uniqueKey ? null : uniqueKey)
                    }
                    onDepositClick={() => setShowWalletModal(true)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {!hasActiveSchedule && (
          <div className="px-3 sm:px-6 pt-2 pb-4 sm:pb-6">
            <div className="mt-2 sm:mt-3 pt-1 sm:pt-2">
              <div className="flex flex-col space-y-3">
                <Balance
                  balanceFormatted={balanceFormatted || '0.00'}
                  minimumDeposit={VITE_VINCENT_YIELD_MINIMUM_DEPOSIT}
                  balanceLoading={balanceLoading}
                  balanceError={balanceError}
                  depositComplete={depositComplete}
                  amountNeeded={amountNeeded}
                  progressPercentage={progressPercentage}
                  onRefreshBalance={refetchBalance}
                  onDepositClick={() => setShowWalletModal(true)}
                />
              </div>
            </div>
          </div>
        )}

        {!hasActiveSchedule && (
          <div className="flex flex-col items-center py-4 sm:py-5 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {loading && loadingStatus && (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3 w-3 animate-spin" style={{ color: '#ff4205' }} />
                <span className={`${theme.textMuted} text-xs font-medium`}>{loadingStatus}</span>
              </div>
            )}

            {activationError && (
              <div className="text-red-500 text-xs text-center font-medium">{activationError}</div>
            )}

            <Button
              onClick={handleActivate}
              disabled={!depositComplete || loading}
              variant="primary"
              size="md"
              style={{
                fontSize: 'clamp(0.625rem, 2.5vw, 0.75rem)',
                padding: 'clamp(0.375rem, 0.75vw, 0.5rem) clamp(1rem, 4vw, 2rem)',
              }}
            >
              {loading ? 'Activating...' : 'Activate Vincent Yield'}
            </Button>
          </div>
        )}

        <FAQ items={faqData} />
        <Footer />
      </div>

      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        walletAddress={authInfo?.pkp.ethAddress || ''}
      />
    </div>
  );
};
