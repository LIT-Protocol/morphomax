import consola from 'consola';
import { ethers } from 'ethers';
import { mongo } from 'mongoose';

import { IRelayPKP } from '@lit-protocol/types';

import { AppData, getJobVersion } from './jobVersion';
import * as optimizeMorphoYieldJobDef from './optimizeMorphoYield';
import { getAgenda } from '../agenda/agendaClient';
import {
  baseProvider,
  getAddressesByChainId,
  getERC20Balance,
  getUserPositions,
  redeemVaults,
} from './optimizeMorphoYield/utils';
import { MorphoSwap } from '../mongo/models/MorphoSwap';

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

const logger = consola.withTag('optimizeMorphoYieldJobManager');

export async function findJobs(
  params: FindSpecificScheduledJobParams
): Promise<optimizeMorphoYieldJobDef.JobType[]>;
export async function findJobs({
  mustExist,
  scheduleId,
  walletAddress,
}: FindSpecificScheduledJobParams): Promise<optimizeMorphoYieldJobDef.JobType[]> {
  const agendaClient = getAgenda();

  const jobs = ((await agendaClient.jobs({
    ...(scheduleId ? { _id: new mongo.ObjectId(scheduleId) } : {}),
    'data.pkpInfo.ethAddress': walletAddress,
  })) || []) as optimizeMorphoYieldJobDef.JobType[];

  logger.log(`Found ${jobs.length} jobs for address ${walletAddress}`);
  if (mustExist && !jobs.length) {
    throw new Error(`No Vincent Yield schedule found for ${walletAddress}`);
  }

  return jobs;
}

export async function listJobsByWalletAddress({ walletAddress }: { walletAddress: string }) {
  logger.log('listing jobs', { walletAddress });
  const agendaJobs = await findJobs({ walletAddress });

  const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);

  const jobsWithStatus = await Promise.all(
    agendaJobs.map(async (agendaJob) => {
      const { pkpInfo } = agendaJob.attrs.data;

      const [userBalance, userPositions] = await Promise.all([
        getERC20Balance({
          pkpInfo,
          provider: baseProvider,
          tokenAddress: USDC_ADDRESS,
        }),
        getUserPositions({
          pkpInfo,
          chainId: baseProvider.network.chainId,
        }),
      ]);

      return {
        _id: String(agendaJob.attrs._id),
        data: agendaJob.attrs.data,
        disabled: agendaJob.attrs.disabled,
        failedAt: agendaJob.attrs.failedAt,
        failReason: agendaJob.attrs.failReason,
        investedAmountUsd: userPositions?.user.vaultPositions
          ? String(
              userPositions.user.vaultPositions.reduce(
                (acc, vaultPosition) => acc + (vaultPosition.state?.assetsUsd || 0),
                0
              )
            )
          : 0,
        lastFinishedAt: agendaJob.attrs.lastFinishedAt,
        lastRunAt: agendaJob.attrs.lastRunAt,
        nextRunAt: agendaJob.attrs.nextRunAt,
        uninvestedAmountUsd: ethers.utils.formatUnits(userBalance.balance, userBalance.decimals),
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
    const userPositions = await getUserPositions({
      pkpInfo,
      chainId: baseProvider.network.chainId,
    });
    const userVaultPositions = userPositions?.user.vaultPositions;
    const redeems = userVaultPositions?.length
      ? await redeemVaults({
          app,
          pkpInfo,
          userVaultPositions,
          provider: baseProvider,
        })
      : [];
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      pkpInfo,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });

    const morphoSwap = new MorphoSwap({
      pkpInfo,
      redeems,
      scheduleId,
      userPositions,
      deposits: [],
      success: true,
      userTokenBalance: tokenBalance,
    });
    await morphoSwap.save();
  }

  return job;
}

export async function createJob(
  data: Omit<optimizeMorphoYieldJobDef.JobParams, 'jobVersion' | 'updatedAt'>,
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
    job = agenda.create<optimizeMorphoYieldJobDef.JobParams>(optimizeMorphoYieldJobDef.jobName, {
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
