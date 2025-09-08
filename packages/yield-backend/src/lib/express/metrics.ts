import { Response } from 'express';

import { VincentAuthenticatedRequest } from './types';
import { getAgenda } from '../agenda/agendaClient';
import { serviceLogger } from '../logger';
import { YieldSwap } from '../mongo/models/YieldSwap';

export const handleGetMetricsRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  try {
    serviceLogger.info('Fetching metrics data');

    // Get agenda jobs
    const agenda = getAgenda();
    const agendaJobs = await agenda._collection.find({}).toArray();

    // Get morphoswaps (YieldSwap collection)
    const morphoSwaps = await YieldSwap.find({}).sort({ createdAt: -1 }).limit(100).lean();

    const metrics = {
      agendaJobs: {
        byStatus: {
          completed: agendaJobs.filter((job) => job.lastFinishedAt).length,
          failed: agendaJobs.filter((job) => job.failCount > 0).length,
          running: agendaJobs.filter((job) => job.lockedAt && !job.lastFinishedAt).length,
          scheduled: agendaJobs.filter((job) => job.nextRunAt && !job.lastFinishedAt).length,
        },
        jobs: agendaJobs.map((job) => ({
          data: job.data,
          disabled: job.disabled || false,
          failCount: job.failCount || 0,
          failedAt: job.failedAt,
          lastFinishedAt: job.lastFinishedAt,
          lastRunAt: job.lastRunAt,
          name: job.name,
          nextRunAt: job.nextRunAt,
          repeatInterval: job.repeatInterval,
        })),
        total: agendaJobs.length,
      },
      morphoSwaps: {
        recent: morphoSwaps.map((swap) => ({
          createdAt: swap.createdAt,
          deposits: swap.deposits?.length || 0,
          id: swap._id,
          pkpAddress: swap.pkpInfo?.ethAddress,
          redeems: swap.redeems?.length || 0,
          scheduleId: swap.scheduleId,
          success: swap.success,
          topVault: swap.topVault
            ? {
                address: swap.topVault.address,
                apy: swap.topVault.state?.apy,
                name: swap.topVault.name,
                netApy: swap.topVault.state?.netApy,
              }
            : null,
          updatedAt: swap.updatedAt,
        })),
        total: await YieldSwap.countDocuments(),
      },
    };

    res.json(metrics);
  } catch (error) {
    serviceLogger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};
