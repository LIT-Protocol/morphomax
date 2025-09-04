import * as Sentry from '@sentry/node';
import { ethers } from 'ethers';

import { optimizeYield } from './optimizeYield';
import { disconnectVincentAbilityClients } from './utils';
import { createAgenda } from '../../agenda/agendaClient';
import { env } from '../../env';
import { connectToMongoDB } from '../../mongo/mongoose';
import { findJobs } from '../yieldJobManager';

const { MONGODB_URI } = env;

async function main() {
  // Input validation
  const walletAddress = process.argv[2] || '';
  if (!ethers.utils.isAddress(walletAddress)) {
    throw new Error(
      `Invalid address: ${walletAddress}. Run with $ pnpm run optimize:manual <ethAddress>`
    );
  }

  // Setup
  const [agenda, mongo] = await Promise.all<any>([createAgenda(), connectToMongoDB(MONGODB_URI)]);

  // Job run
  const jobs = await findJobs({ walletAddress, mustExist: true });
  await Promise.all(jobs.map((j) => Sentry.withIsolationScope((s) => optimizeYield(j, s))));

  // Teardown
  await Promise.all([agenda.stop(), mongo.close(), disconnectVincentAbilityClients()]);
}

main();
