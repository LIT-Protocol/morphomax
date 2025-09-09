import * as Sentry from '@sentry/node';
import consola from 'consola';
import { ethers } from 'ethers';
import { mongo } from 'mongoose';

import { IRelayPKP } from '@lit-protocol/types';

import { AppData, getJobVersion } from './jobVersion';
import * as optimizeYieldJobDef from './optimizeYield';
import { getAgenda } from '../agenda/agendaClient';
import { morphoUsdcBalanceMonitor } from '../balanceMonitor';
import {
  baseProvider,
  getAddressesByChainId,
  getERC20Balance,
  redeemVaults,
} from './optimizeYield/utils';
import { YieldSwap } from '../mongo/models/YieldSwap';

interface FindSpecificScheduledJobParams {
  mustExist?: boolean;
  scheduleId?: string;
  walletAddress: string;
}

interface CancelJobParams {
  app: AppData;
  pkpInfo: IRelayPKP;
  scheduleId: string;
}

const logger = consola.withTag('optimizeYieldJobManager');

export async function findJobs(
  params: FindSpecificScheduledJobParams
): Promise<optimizeYieldJobDef.JobType[]>;
export async function findJobs({
  mustExist,
  scheduleId,
  walletAddress,
}: FindSpecificScheduledJobParams): Promise<optimizeYieldJobDef.JobType[]> {
  const agendaClient = getAgenda();

  const jobs = ((await agendaClient.jobs({
    ...(scheduleId ? { _id: new mongo.ObjectId(scheduleId) } : {}),
    'data.pkpInfo.ethAddress': walletAddress,
  })) || []) as optimizeYieldJobDef.JobType[];

  logger.log(`Found ${jobs.length} jobs for address ${walletAddress}`);
  if (mustExist && !jobs.length) {
    throw new Error(`No Yield optimization schedule found for ${walletAddress}`);
  }

  return jobs;
}

interface InvestedBalance {
  decimals: number;
  investedAmountUsdc: ethers.BigNumber;
  uninvestedAmountUsdc: ethers.BigNumber;
}

export async function getScheduleBalances({
  walletAddress,
}: {
  walletAddress: string;
}): Promise<InvestedBalance> {
  const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);

  const [userUsdcBalance, userMorphoUsdcPositions] = await Promise.all([
    getERC20Balance({
      ethAddress: walletAddress,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    }),
    morphoUsdcBalanceMonitor.getUserPositions(walletAddress),
  ]);

  const investedAmountUsdc = userMorphoUsdcPositions.reduce(
    (b, p) => b.add(p.assets),
    ethers.constants.Zero
  );

  return {
    investedAmountUsdc,
    decimals: userUsdcBalance.decimals,
    uninvestedAmountUsdc: userUsdcBalance.balance,
  };
}

export async function listJobsByWalletAddress({ walletAddress }: { walletAddress: string }) {
  logger.log('listing jobs', { walletAddress });
  const agendaJobs = await findJobs({ walletAddress });

  const jobsWithStatus = await Promise.all(
    agendaJobs.map(async (agendaJob) => {
      const { pkpInfo } = agendaJob.attrs.data;

      const { decimals, investedAmountUsdc, uninvestedAmountUsdc } = await getScheduleBalances({
        walletAddress: pkpInfo.ethAddress,
      });

      return {
        _id: String(agendaJob.attrs._id),
        data: agendaJob.attrs.data,
        disabled: agendaJob.attrs.disabled,
        failedAt: agendaJob.attrs.failedAt,
        failReason: agendaJob.attrs.failReason,
        investedAmountUsdc: ethers.utils.formatUnits(investedAmountUsdc, decimals),
        lastFinishedAt: agendaJob.attrs.lastFinishedAt,
        lastRunAt: agendaJob.attrs.lastRunAt,
        nextRunAt: agendaJob.attrs.nextRunAt,
        uninvestedAmountUsdc: ethers.utils.formatUnits(uninvestedAmountUsdc, decimals),
      };
    })
  );

  return jobsWithStatus;
}

export async function cancelJob({ app, pkpInfo, scheduleId }: CancelJobParams) {
  const walletAddress = pkpInfo.ethAddress;

  // Idempotent; if a job we're trying to disable doesn't return, it is disabled or does not belong to this wallet.
  const jobs = await findJobs({ scheduleId, walletAddress, mustExist: false });
  const job = jobs[0];
  if (!job) return null;

  logger.log(`Disabling Vincent Yield job for ${walletAddress}`);
  job.disable();
  job.attrs.data.updatedAt = new Date();

  await job.save();

  if (job) {
    const userVaultPositions = await morphoUsdcBalanceMonitor.getUserPositions(pkpInfo.ethAddress);
    const allRedeems = await redeemVaults({
      app,
      pkpInfo,
      userVaultPositions,
      provider: baseProvider,
    });
    const redeems = allRedeems.filter((redeem) => {
      if (redeem.status !== 'success') {
        const { error, ...rest } = redeem;
        Sentry.captureException(error, {
          extra: {
            redeem: { ...rest },
          },
        });
        return false;
      }
      return true;
    });

    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      ethAddress: pkpInfo.ethAddress,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });

    const morphoSwap = new YieldSwap({
      pkpInfo,
      redeems,
      scheduleId,
      userVaultPositions,
      deposits: [],
      success: true,
      userTokenBalance: tokenBalance,
    });
    await morphoSwap.save();
  }

  return job;
}

export async function createJob(
  data: Omit<optimizeYieldJobDef.JobParams, 'jobVersion' | 'updatedAt'>,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
) {
  const agenda = getAgenda();
  const walletAddress = data.pkpInfo.ethAddress;

  let resetSchedule = false;

  // Look for user jobs and create one if none exist
  const jobs = await findJobs({ walletAddress, mustExist: false });
  let job = jobs[0];
  if (!job) {
    job = agenda.create<optimizeYieldJobDef.JobParams>(optimizeYieldJobDef.jobName, {
      ...data,
      jobVersion: getJobVersion(data.app.version),
      updatedAt: new Date(),
    });

    // Currently we only allow a single Vincent Yield per walletAddress
    job.unique({ 'data.pkpInfo.ethAddress': walletAddress });
  } else {
    // Job was already created, reset schedule to run now
    resetSchedule = true;
  }

  // Schedule the job based on provided options
  if (options.interval) {
    // Use 'every' for interval-based scheduling
    logger.log('Setting interval to', options.interval);
    job.repeatEvery(options.interval);
  } else if (options.schedule) {
    // Use 'schedule' for one-time or cron-based scheduling
    job.schedule(options.schedule);
  }

  // Activate the job and save it to persist it
  job.attrs.data.updatedAt = new Date();
  job.enable();

  await job.save();
  logger.log(`Created Vincent Yield job ${job.attrs._id}`);

  if (resetSchedule) job.run();

  return job;
}
