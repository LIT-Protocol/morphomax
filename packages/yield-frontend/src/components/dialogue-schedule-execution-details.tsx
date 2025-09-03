import { LIT_EVM_CHAINS } from '@lit-protocol/constants';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { PlusSquare } from 'lucide-react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useBackend, Schedule, Swap } from '@/hooks/useBackend';
import { shortenHex } from '@/lib/hex';
import { cn } from '@/lib/utils';

const BASE = LIT_EVM_CHAINS.base;

export interface ScheduleDetailsDialogProps {
  schedule: Schedule;
}

function renderSwapRows(swap: Swap) {
  const { deposits, redeems } = swap;

  return (
    <>
      {redeems.map((redeem) => (
        <TableRow key={redeem.txHash}>
          <TableCell className="text-left">Base</TableCell>
          <TableCell className="text-center">Redeem</TableCell>
          <TableCell className="text-center">{shortenHex(redeem.vaultAddress)}</TableCell>
          <TableCell className="text-center">{redeem.amount}</TableCell>
          <TableCell className="text-right">
            <a
              href={`${BASE.blockExplorerUrls[0]}/tx/${redeem.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:opacity-80"
            >
              {shortenHex(redeem.txHash)}
            </a>
          </TableCell>
        </TableRow>
      ))}
      {deposits.map((deposit) => (
        <>
          {deposit.approval.approvalTxHash && (
            <TableRow key={deposit.approval.approvalTxHash}>
              <TableCell className="text-left">Base</TableCell>
              <TableCell className="text-center">Approval</TableCell>
              <TableCell className="text-center">
                {shortenHex(deposit.approval.tokenAddress)}
              </TableCell>
              <TableCell className="text-center">
                {ethers.utils.formatUnits(
                  deposit.approval.approvedAmount,
                  deposit.approval.tokenDecimals
                )}
              </TableCell>
              <TableCell className="text-right">
                <a
                  href={`${BASE.blockExplorerUrls[0]}/tx/${deposit.approval.approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                >
                  {shortenHex(deposit.approval.approvalTxHash)}
                </a>
              </TableCell>
            </TableRow>
          )}
          <TableRow key={deposit.deposit.txHash}>
            <TableCell className="text-left">Base</TableCell>
            <TableCell className="text-center">Deposit</TableCell>
            <TableCell className="text-center">
              {shortenHex(deposit.deposit.vaultAddress)}
            </TableCell>
            <TableCell className="text-center">{deposit.deposit.amount}</TableCell>
            <TableCell className="text-right">
              <a
                href={`${BASE.blockExplorerUrls[0]}/tx/${deposit.deposit.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
              >
                {shortenHex(deposit.deposit.txHash)}
              </a>
            </TableCell>
          </TableRow>
          ;
        </>
      ))}
    </>
  );
}

export const DialogueScheduleExecutionDetails: React.FC<ScheduleDetailsDialogProps> = ({
  schedule,
}) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const { getScheduleSwaps } = useBackend();

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleString();
  };

  const failedAfterLastRun =
    schedule.failedAt && schedule.lastFinishedAt
      ? new Date(schedule.lastFinishedAt) <= new Date(schedule.failedAt)
      : false;

  useEffect(() => {
    const fetchSwaps = async () => {
      try {
        setLoading(true);
        const swaps = await getScheduleSwaps(schedule._id);
        setSwaps(swaps);
      } catch (error) {
        console.error('Error fetching swaps:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSwaps();
  }, [schedule._id, getScheduleSwaps, setSwaps]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary-outline">
          <PlusSquare />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(failedAfterLastRun ? 'min-w-2/3' : '', 'overflow-hidden')}>
        <DialogHeader>
          <DialogTitle>Vincent Yield Schedule Details</DialogTitle>
          <DialogDescription>
            Detailed information about your Vincent Yield maxing scheduled run.
          </DialogDescription>
        </DialogHeader>

        <Box className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
          {schedule.failedAt && failedAfterLastRun && (
            <>
              <Separator />

              <div className="grid grid-cols-[auto,1fr] gap-3 items-baseline">
                <span className="font-medium whitespace-nowrap">Failed At:</span>
                <span className="overflow-hidden text-ellipsis text-red-500">
                  {formatDate(schedule.failedAt)}
                </span>
              </div>

              {schedule.failReason && (
                <>
                  <Separator />

                  <div>
                    <span className="font-medium block mb-2">Failure Reason:</span>
                    <div
                      className="text-red-500 text-sm border border-gray-200 rounded p-3 max-h-[120px] overflow-y-auto break-words whitespace-pre-wrap"
                      style={{ wordBreak: 'break-word', maxHeight: '120px', overflowY: 'scroll' }}
                      dangerouslySetInnerHTML={{
                        __html: schedule.failReason.replace(/\\n/g, '<br />'),
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center">
              <Spinner />
            </div>
          )}

          {swaps.length > 0 && (
            <>
              <Separator />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Chain</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Target</TableHead>
                    <TableHead className="text-center">Amount</TableHead>
                    <TableHead className="text-right">Hash</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>{renderSwapRows(swaps[0])}</TableBody>
              </Table>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
