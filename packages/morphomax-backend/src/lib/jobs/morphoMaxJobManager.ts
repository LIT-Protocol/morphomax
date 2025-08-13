import consola from 'consola';

import * as optimizeMorphoYieldJobDef from './optimizeMorphoYield';
import { getAgenda } from '../agenda/agendaClient';
import {
  baseProvider,
  getAddressesByChainId,
  getERC20Balance,
  getMorphoPositions,
  redeemMorphoVaults,
} from './optimizeMorphoYield/utils';
import { MorphoSwap } from '../mongo/models/MorphoSwap';

interface FindSpecificScheduledJobParams {
  mustExist?: boolean;
  walletAddress: string;
}

interface CancelJobParams {
  receiverAddress?: string | null;
  scheduleId: string;
  walletAddress: string;
}

const logger = consola.withTag('optimizeMorphoYieldJobManager');

export async function listJobsByWalletAddress({ walletAddress }: { walletAddress: string }) {
  const agendaClient = getAgenda();
  logger.log('listing jobs', { walletAddress });

  return (await agendaClient.jobs({
    'data.pkpInfo.ethAddress': walletAddress,
  })) as optimizeMorphoYieldJobDef.JobType[];
}

export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<optimizeMorphoYieldJobDef.JobType>;
export async function findJob(
  params: FindSpecificScheduledJobParams
): Promise<optimizeMorphoYieldJobDef.JobType | undefined>;
export async function findJob({
  mustExist,
  walletAddress,
}: FindSpecificScheduledJobParams): Promise<optimizeMorphoYieldJobDef.JobType | undefined> {
  const agendaClient = getAgenda();

  const jobs = (await agendaClient.jobs({
    'data.pkpInfo.ethAddress': walletAddress,
  })) as optimizeMorphoYieldJobDef.JobType[];

  logger.log(`Found ${jobs.length} jobs for address ${walletAddress}`);
  if (mustExist && !jobs.length) {
    throw new Error(`No Vincent Yield schedule found for ${walletAddress}`);
  }

  return jobs[0];
}

export async function cancelJob({ scheduleId, walletAddress }: CancelJobParams) {
  // Idempotent; if a job we're trying to disable doesn't exist, it is disabled.
  const job = await findJob({ walletAddress, mustExist: false });

  if (!job) return null;

  logger.log(`Disabling Vincent Yield job for ${walletAddress}`);
  job.disable();
  job.attrs.data.updatedAt = new Date();

  await job.save();

  if (job) {
    const userPositions = await getMorphoPositions({
      walletAddress,
      chainId: baseProvider.network.chainId,
    });
    const userVaultPositions = userPositions?.user.vaultPositions;
    const redeems = userVaultPositions?.length
      ? await redeemMorphoVaults({
          userVaultPositions,
          walletAddress,
          provider: baseProvider,
        })
      : [];
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      walletAddress,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });

    const morphoSwap = new MorphoSwap({
      redeems,
      scheduleId,
      userPositions,
      walletAddress,
      deposits: [],
      success: true,
      userTokenBalance: tokenBalance,
    });
    await morphoSwap.save();
  }

  return job;
}

export async function createJob(
  data: Omit<optimizeMorphoYieldJobDef.JobParams, 'updatedAt'>,
  options: {
    interval?: string;
    schedule?: string;
  } = {}
) {
  const agenda = getAgenda();

  // Create a new job instance
  let job = await findJob({ walletAddress, mustExist: false });
  if (!job) {
    job = agenda.create<optimizeMorphoYieldJobDef.JobParams>(optimizeMorphoYieldJobDef.jobName, {
      ...data,
      updatedAt: new Date(),
    });

    // Currently we only allow a single Vincent Yield per walletAddress
    job.unique({ 'data.pkpInfo.ethAddress': data.walletAddress });
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

  return job;
}
