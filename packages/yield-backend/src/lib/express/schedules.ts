import { ethers } from 'ethers';
import { Request, Response } from 'express';

import { getAppInfo, getPKPInfo, isAppUser } from '@lit-protocol/vincent-app-sdk/jwt';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';
import { VincentAuthenticatedRequest } from './types';
import * as jobManager from '../jobs/yieldJobManager';
import { YieldSwap } from '../mongo/models/YieldSwap';

const { cancelJob, createJob, getScheduleBalances, listJobsByWalletAddress } = jobManager;

function getAppAndPKPInfoFromJWT(req: VincentAuthenticatedRequest) {
  if (!isAppUser(req.user.decodedJWT)) {
    throw new Error('Vincent JWT is not an app user');
  }

  const app = getAppInfo(req.user.decodedJWT);
  const pkpInfo = getPKPInfo(req.user.decodedJWT);

  return { app, pkpInfo };
}

export const handleGetScheduleBalancesRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { ethAddress } = getPKPInfo(req.user.decodedJWT);

  const { decimals, investedAmountUsdc, uninvestedAmountUsdc } = await getScheduleBalances({
    walletAddress: ethAddress,
  });

  res.json({
    data: {
      investedAmountUsdc: ethers.utils.formatUnits(investedAmountUsdc, decimals),
      uninvestedAmountUsdc: ethers.utils.formatUnits(uninvestedAmountUsdc, decimals),
    },
    success: true,
  });
};
export const handleGetScheduleBalancesRouteForGalxe = async (req: Request, res: Response) => {
  const { address } = req.query;
  if (!address) {
    throw new Error('Missing address');
  }

  const { decimals, investedAmountUsdc, uninvestedAmountUsdc } = await getScheduleBalances({
    walletAddress: String(address),
  });

  res.json({
    data: {
      investedAmountUsdc: ethers.utils.formatUnits(investedAmountUsdc, decimals),
      uninvestedAmountUsdc: ethers.utils.formatUnits(uninvestedAmountUsdc, decimals),
    },
    success: true,
  });
};

export const handleListSchedulesRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const { ethAddress } = getPKPInfo(req.user.decodedJWT);
  const schedules = await listJobsByWalletAddress({ walletAddress: ethAddress });

  res.json({ data: schedules, success: true });
};

export const handleCreateScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { app, pkpInfo } = getAppAndPKPInfoFromJWT(req);

  const scheduleParams = ScheduleParamsSchema.parse({
    pkpInfo,
    app: {
      id: app.appId,
      version: app.version,
    },
  });

  const schedule = await createJob({ ...scheduleParams }, { interval: 'weekly' });
  res.status(201).json({ data: schedule.toJson(), success: true });
};

export const handleListScheduleSwapsRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { ethAddress } = getPKPInfo(req.user.decodedJWT);
  const { limit = 10, skip = 0 } = req.query;

  const swaps = await YieldSwap.find({ pkpInfo: { ethAddress } })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .skip(skip)
    .lean();

  if (swaps.length === 0) {
    res.status(404).json({ error: `No swaps found for wallet address ${ethAddress}` });
    return;
  }

  res.json({ data: swaps, success: true });
};

export const handleDeleteScheduleRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
) => {
  const { app, pkpInfo } = getAppAndPKPInfoFromJWT(req);

  const scheduleParams = ScheduleParamsSchema.parse({
    pkpInfo,
    app: {
      id: app.appId,
      version: app.version,
    },
  });
  const { scheduleId } = ScheduleIdentitySchema.parse(req.params);

  await cancelJob({ ...scheduleParams, scheduleId });

  res.json({ success: true });
};
