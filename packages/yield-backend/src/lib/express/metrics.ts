import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import { serviceLogger } from '../logger';
import { YieldSwap } from '../mongo/models/YieldSwap';

export const handleGetMetricsRoute = async (req: Request, res: Response) => {
  try {
    serviceLogger.info('Fetching metrics data');

    if (!mongoose.connection.db) {
      serviceLogger.error('MongoDB connection not found');
      res.status(500).json({ error: 'MongoDB connection not found' });
      return;
    }

    // Parse pagination parameters from query string
    const agendaPage = parseInt(req.query.agendaPage as string, 10) || 1;
    const morphoPage = parseInt(req.query.morphoPage as string, 10) || 1;
    const itemsPerPage = Math.max(parseInt(req.query.itemsPerPage as string, 10), 20);

    // Get agenda jobs directly from MongoDB collection
    let agendaJobs: any[] = [];
    let totalAgendaJobs = 0;
    try {
      const agendaCollection = mongoose.connection.db.collection('agendaJobs');

      // Get total count
      totalAgendaJobs = await agendaCollection.countDocuments({});

      // Get paginated agenda jobs
      const agendaSkip = (agendaPage - 1) * itemsPerPage;
      agendaJobs = await agendaCollection.find({}).skip(agendaSkip).limit(itemsPerPage).toArray();

      serviceLogger.info(
        `Found ${agendaJobs.length} agenda jobs (page ${agendaPage}, total: ${totalAgendaJobs})`
      );
    } catch (agendaError) {
      serviceLogger.warn('Failed to fetch agenda jobs:', agendaError);
      Sentry.captureException(agendaError, {
        extra: {
          agendaPage,
          itemsPerPage,
          context: 'metrics_fetch_agenda_jobs',
        },
      });
    }

    // Get total morpho swaps count
    const totalMorphoSwaps = await YieldSwap.countDocuments();

    // Get paginated morphoswaps (YieldSwap collection)
    const morphoSkip = (morphoPage - 1) * itemsPerPage;
    const morphoSwaps = await YieldSwap.find({})
      .sort({ createdAt: -1 })
      .skip(morphoSkip)
      .limit(itemsPerPage)
      .lean();

    // Calculate status counts efficiently using aggregation
    let statusCounts: { completed: number; failed: number; running: number; scheduled: number } = {
      completed: 0,
      failed: 0,
      running: 0,
      scheduled: 0,
    };

    try {
      const agendaCollection = mongoose.connection.db.collection('agendaJobs');

      // Use aggregation pipeline to count each status efficiently
      const statusAggregation = (await agendaCollection
        .aggregate([
          {
            $group: {
              _id: null,
              completed: {
                $sum: {
                  $cond: [{ $ne: ['$lastFinishedAt', null] }, 1, 0],
                },
              },
              failed: {
                $sum: {
                  $cond: [{ $gt: [{ $ifNull: ['$failCount', 0] }, 0] }, 1, 0],
                },
              },
              running: {
                $sum: {
                  $cond: [
                    {
                      $and: [{ $ne: ['$lockedAt', null] }, { $eq: ['$lastFinishedAt', null] }],
                    },
                    1,
                    0,
                  ],
                },
              },
              scheduled: {
                $sum: {
                  $cond: [
                    {
                      $and: [{ $ne: ['$nextRunAt', null] }, { $eq: ['$lastFinishedAt', null] }],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray()) as Array<{
        _id: null;
        completed: number;
        failed: number;
        running: number;
        scheduled: number;
      }>;

      const [first] = statusAggregation;
      if (first) {
        const { completed, failed, running, scheduled } = first;
        statusCounts = { completed, failed, running, scheduled };
      }

      serviceLogger.info('Calculated agenda job status counts:', statusCounts);
    } catch (error) {
      serviceLogger.warn('Failed to fetch agenda job status counts:', error);
      Sentry.captureException(error, {
        extra: {
          context: 'metrics_fetch_agenda_status_counts',
        },
      });
    }

    const metrics = {
      agendaJobs: {
        itemsPerPage,
        byStatus: statusCounts,
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
        page: agendaPage,
        total: totalAgendaJobs,
        totalPages: Math.ceil(totalAgendaJobs / itemsPerPage),
      },
      morphoSwaps: {
        itemsPerPage,
        page: morphoPage,
        recent: morphoSwaps.map((swap) => ({
          createdAt: swap.createdAt,
          deposits: swap.deposits.length,
          id: swap._id,
          pkpAddress: swap.pkpInfo.ethAddress,
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
          userTokenBalances: swap.userTokenBalances || [],
        })),
        total: totalMorphoSwaps,
        totalPages: Math.ceil(totalMorphoSwaps / itemsPerPage),
      },
    };

    res.json(metrics);
  } catch (error) {
    serviceLogger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};
