import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useCallback, useState } from 'react';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useBackend, Schedule } from '@/hooks/useBackend';
import { Hex, isHex } from '@/lib/hex';
import { cn } from '@/lib/utils';

export interface ScheduleDetailsDialogProps {
  schedule: Schedule;
  onDelete?: () => void;
}

export const DialogueWithdraw: React.FC<ScheduleDetailsDialogProps> = ({ schedule, onDelete }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [receiverAddress, setReceiverAddress] = useState<string>('');
  const { deleteSchedule } = useBackend();

  const deleteUserSchedule = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (receiverAddress && !isHex(receiverAddress)) {
        alert('Please enter a valid address. Format: 0x.');
        return;
      }

      try {
        setLoading(true);
        await deleteSchedule(schedule._id, {
          receiverAddress: receiverAddress as Hex,
        });
      } catch (error) {
        console.error('Error deleting Schedule:', error);
        alert('Error deleting Schedule. Please try again.');
      } finally {
        setLoading(false);
        setOpen(false);
      }

      onDelete?.();
    },
    [deleteSchedule, onDelete, receiverAddress, schedule._id]
  );

  const failedAfterLastRun =
    schedule.failedAt && schedule.lastFinishedAt
      ? new Date(schedule.lastFinishedAt) <= new Date(schedule.failedAt)
      : false;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={loading}
          className="w-full bg-purple-600 text-white hover:bg-purple-700 py-2 px-4 rounded-md transition-colors"
        >
          {loading ? <Spinner /> : 'Stop Agent and Withdraw Funds from Morpho'}
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(failedAfterLastRun ? 'min-w-2/3' : '', 'overflow-hidden')}>
        <form onSubmit={deleteUserSchedule}>
          <DialogHeader>
            <DialogTitle>Delete Vincent Yield Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule?
              <br />
              To revert this operation you will need to create a new schedule.
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <Box className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Withdrawal Address (optional)</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
              />
              <p className="text-gray-600">
                By leaving this field empty, funds will stay in your Agent PKP Wallet.
              </p>
            </div>
          </Box>

          <Separator className="my-4" />

          <DialogFooter>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? <Spinner /> : 'Delete Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
