import { Response } from 'express';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';
import { VincentAuthenticatedRequest } from './types';
import * as jobManager from '../jobs/morphoMaxJobManager';
import { MorphoSwap } from '../mongo/models/MorphoSwap';

const { cancelJob, createJob, listJobsByWalletAddress } = jobManager;

export const handleListSchedulesRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  try {
    const {
      pkpInfo: { ethAddress },
    } = req.user.decodedJWT.payload;
    const schedules = await listJobsByWalletAddress({ walletAddress: ethAddress });

    res.json({ data: schedules.map((s) => s.toJson()), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleCreateScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const { pkpInfo } = req.user.decodedJWT.payload;

    const scheduleParams = ScheduleParamsSchema.parse({
      pkpInfo,
    });

    const schedule = await createJob({ ...scheduleParams }, { interval: 'weekly' });
    res.status(201).json({ data: schedule.toJson(), success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const handleListScheduleSwapsRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const {
    pkpInfo: { ethAddress },
  } = req.user.decodedJWT.payload;
  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);
  const { limit = 10, skip = 0 } = req.query;

  const swaps = await MorphoSwap.find({ scheduleId, walletAddress: ethAddress })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .skip(skip)
    .lean();

  if (swaps.length === 0) {
    res.status(404).json({ error: `No morpho swaps found for wallet address ${ethAddress}` });
    return;
  }

  res.json({ data: swaps, success: true });
};

export const handleDeleteScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      pkpInfo: { ethAddress },
    } = req.user.decodedJWT.payload;
    const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

    await cancelJob({ scheduleId, walletAddress: ethAddress });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
