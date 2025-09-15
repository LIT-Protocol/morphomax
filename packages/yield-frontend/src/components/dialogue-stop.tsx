import React, { useCallback, useState } from 'react';
import * as Sentry from '@sentry/react';

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
import { cn } from '@/lib/utils';

export interface ScheduleDetailsDialogProps {
  schedule: Schedule;
  onDelete?: () => void;
}

export const DialogueStop: React.FC<ScheduleDetailsDialogProps> = ({ schedule, onDelete }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const { deleteSchedule } = useBackend();

  const deleteUserSchedule = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        setLoading(true);
        await deleteSchedule(schedule._id);
      } catch (error) {
        console.error('Error deleting Schedule:', error);
        Sentry.captureException(error, {
          extra: { operation: 'deleteSchedule', scheduleId: schedule._id },
        });
        alert('Error deleting Schedule. Please try again.');
      } finally {
        setLoading(false);
        setOpen(false);
      }

      onDelete?.();
    },
    [deleteSchedule, onDelete, schedule._id]
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
          {loading ? <Spinner /> : 'Stop Vincent Yield Agent'}
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(failedAfterLastRun ? 'min-w-2/3' : '', 'overflow-hidden')}>
        <form onSubmit={deleteUserSchedule}>
          <DialogHeader>
            <DialogTitle>Stop Vincent Yield Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop this agent?
              <br />
              To revert this operation you will need to start it again. it won't optimize positions
              while stopped.
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <DialogFooter>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? <Spinner /> : 'Stop Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
