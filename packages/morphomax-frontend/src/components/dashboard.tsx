import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';

import { DialogueScheduleExecutionDetails } from '@/components/dialogue-schedule-execution-details';
import { DialogueStop } from '@/components/dialogue-stop';
import { EnforcementDisclaimer } from '@/components/enforcement-disclaimer';
import { OptimalStrategyInfo } from '@/components/optimal-strategy-info';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JwtContext } from '@/contexts/jwt';
import { useBackend, Schedule } from '@/hooks/useBackend';
import { shortenHex } from '@/lib/hex';
import { cn } from '@/lib/utils';

const BASE = LIT_EVM_CHAINS.base;

function renderSchedulesTable(activeSchedules: Schedule[]) {
  return (
    <div className="w-full">
      {/* Mobile: stacked cards to avoid horizontal overflow */}
      <div className="sm:hidden space-y-2">
        {activeSchedules.map((schedule) => {
          const {
            disabled,
            lastFinishedAt,
            failedAt,
            _id: uniqueKey,
            data: { updatedAt },
          } = schedule;

          const lastRunAt = lastFinishedAt || failedAt || updatedAt;
          const failedAfterLastRun =
            failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;

          const active = !disabled;

          return (
            <div
              key={uniqueKey}
              className="w-full rounded-md border border-gray-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-gray-900">Weekly</div>
                <DialogueScheduleExecutionDetails schedule={schedule} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
                <span
                  className={cn(
                    'font-medium',
                    active && !failedAfterLastRun && 'text-green-600',
                    active && failedAfterLastRun && 'text-red-600'
                  )}
                >
                  {!active ? 'Inactive' : failedAfterLastRun ? 'Failed' : 'Active'}
                </span>
                <span className="break-words">{new Date(lastRunAt).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tablet and up: original table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Frequency</TableHead>
              <TableHead className="text-center">Last Run</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {activeSchedules.map((schedule) => {
              const {
                disabled,
                lastFinishedAt,
                failedAt,
                _id: uniqueKey,
                data: { updatedAt },
              } = schedule;

              const lastRunAt = lastFinishedAt || failedAt || updatedAt;
              const failedAfterLastRun =
                failedAt && lastFinishedAt ? new Date(lastFinishedAt) <= new Date(failedAt) : false;

              const active = !disabled;
              return (
                <TableRow key={uniqueKey}>
                  <TableCell className="text-left">Weekly</TableCell>
                  <TableCell className="text-center">
                    {new Date(lastRunAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={cn(
                        active && !failedAfterLastRun && 'text-green-500',
                        active && failedAfterLastRun && 'text-red-500'
                      )}
                    >
                      {!active ? 'Inactive' : failedAfterLastRun ? 'Failed' : 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DialogueScheduleExecutionDetails schedule={schedule} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { createSchedule, getSchedules } = useBackend();
  const { authInfo, logOut } = useContext(JwtContext);

  const getUserSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const schedules = await getSchedules();
      setSchedules(schedules);
    } catch (error) {
      console.error('Error fetching active Schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, getSchedules, setSchedules]);
  useEffect(() => {
    getUserSchedules();
  }, [getUserSchedules]);

  const createUserSchedule = useCallback(async () => {
    try {
      setLoading(true);
      await createSchedule();
    } catch (error) {
      console.error('Error creating Schedule:', error);
      alert('Error creating Schedule. Please try again.');
    } finally {
      setLoading(false);
    }

    await getUserSchedules();
  }, [setLoading, createSchedule, getUserSchedules]);

  if (!authInfo?.pkp.ethAddress) {
    return <Spinner />;
  }

  return (
    <Card className="w-full max-w-3xl bg-white p-4 shadow-sm rounded-lg">
      <Button
        variant="destructive"
        size="sm"
        className="w-fit absolute top-0 right-0 m-4"
        onClick={logOut}
      >
        Log Out
      </Button>

      <CardHeader className="space-y-3 text-center">
        <CardTitle className="text-3xl font-bold text-gray-900">Vincent Yield Maximizer</CardTitle>
        <CardDescription className="space-y-2">
          <p className="text-gray-800 font-medium">
            This agent helps you earn more yield on your USDC.
          </p>
          <p className="text-gray-600">
            It automatically moves your funds into the highest-yielding Morpho vault.
          </p>
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="space-y-6 text-center">
        {schedules.some((schedule) => !schedule.disabled) ? (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-gray-700">
              Deposit a <span className="font-medium whitespace-nowrap">minimum of 50 USDC</span> or
              more on Base to your Agent Wallet:{' '}
              <a
                href={`${BASE.blockExplorerUrls[0]}/address/${authInfo.pkp.ethAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
                title={authInfo.pkp.ethAddress}
              >
                {authInfo.pkp.ethAddress ? shortenHex(authInfo.pkp.ethAddress) : 'Loading...'}
              </a>
              <br />
              <p className="text-sm text-gray-500">
                Tip: Use{' '}
                <a
                  href={`https://app.debridge.finance/?r=32300&address=${authInfo.pkp.ethAddress}&inputChain=&outputChain=8453&inputCurrency=&outputCurrency=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&dlnMode=simple`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  title="deBridge"
                >
                  deBridge
                </a>{' '}
                to send Base USDC directly to your Agent Wallet from any asset on any chain.
              </p>
            </p>
            <div className="size-1/4 flex justify-center items-center my-4">
              <QRCode
                value={authInfo.pkp.ethAddress}
                style={{ height: '100%', width: '100%' }}
                viewBox={`0 0 96 96`}
                level="H"
              />
            </div>
            <EnforcementDisclaimer />

            <div className="space-y-4">
              {renderSchedulesTable(schedules)}

              <DialogueStop schedule={schedules[0]} onDelete={getUserSchedules} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <p className="font-semibold text-gray-900">How it works:</p>

            <div className="flex flex-col items-center">
              <p className="text-gray-700">
                1. Deposit a{' '}
                <span className="font-medium whitespace-nowrap">minimum of 50 USDC</span> or more on
                Base to your Agent Wallet:{' '}
                <a
                  href={`${BASE.blockExplorerUrls[0]}/address/${authInfo.pkp.ethAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  title={authInfo.pkp.ethAddress}
                >
                  {authInfo.pkp.ethAddress ? shortenHex(authInfo.pkp.ethAddress) : 'Loading...'}
                </a>
                <br />
                <p className="text-sm text-gray-500">
                  Tip: Use{' '}
                  <a
                    href={`https://app.debridge.finance/?r=32300&address=${authInfo.pkp.ethAddress}&inputChain=&outputChain=8453&inputCurrency=&outputCurrency=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&dlnMode=simple`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                    title="deBridge"
                  >
                    deBridge
                  </a>{' '}
                  to send Base USDC directly to your Agent Wallet from any asset on any chain.
                </p>
              </p>

              <div className="flex justify-center items-center size-1/4 my-4">
                <QRCode
                  value={authInfo.pkp.ethAddress}
                  style={{ height: '100%', width: '100%' }}
                  viewBox={`0 0 96 96`}
                  level="H"
                />
              </div>

              <p className="text-gray-700">
                2. Active your Agent Below To Start Optimizing Your Yield!
              </p>
            </div>

            <OptimalStrategyInfo />

            <div className="mt-4">
              <Button
                disabled={loading}
                onClick={createUserSchedule}
                className="w-full bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded-md transition-colors"
              >
                {loading ? <Spinner /> : 'Activate Agent To Maximize Yield'}
              </Button>

              <EnforcementDisclaimer />
            </div>
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col items-center">
        <Footer />
      </CardFooter>
    </Card>
  );
};
