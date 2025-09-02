import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertJobVersion } from '../jobVersion';
import { type UserVaultPositionItem, type UserPositionItem } from './morphoLoader';
import {
  DepositResult,
  ReedemResult,
  baseProvider,
  depositVault,
  getAddressesByChainId,
  getERC20Balance,
  getTopMorphoVault,
  getUserPermittedVersion,
  getUserPositions,
  redeemVaults,
} from './utils';
import { type MorphoVaultInfo } from './utils/get-morpho-vaults';
import { env } from '../../env';
import { YieldSwap } from '../../mongo/models/YieldSwap';

export type JobType = Job<JobParams>;
export type JobParams = {
  app: AppData;
  jobVersion: string;
  name: string;
  pkpInfo: IRelayPKP;
  updatedAt: Date;
};

const { MINIMUM_USDC_BALANCE, MINIMUM_YIELD_IMPROVEMENT_PERCENT, VINCENT_APP_ID } = env;

function getVaultsToOptimize(
  userPositions: UserPositionItem,
  topVault: MorphoVaultInfo
): UserVaultPositionItem[] {
  // TODO improve this calculation
  // Consider the following stuff:
  // - estimated earning in period
  // - performance and management fees
  // - yield in other tokens
  // - gas cost
  const topVaultNetApy = topVault.state?.netApy || 0;
  const suboptimalVaults = userPositions.user.vaultPositions.filter((vp) => {
    const vaultNetApy = vp.vault.state?.netApy || 0;
    return (
      vp.state?.shares > 0 && topVaultNetApy > vaultNetApy + MINIMUM_YIELD_IMPROVEMENT_PERCENT / 100
    );
  });

  return suboptimalVaults;
}

export async function optimizeYield(job: JobType): Promise<void> {
  try {
    const {
      _id,
      data: { pkpInfo },
    } = job.attrs;
    let { app } = job.attrs.data;

    consola.log('Starting yield optimization job...', {
      _id,
      pkpInfo,
    });

    consola.debug('Fetching current top strategy, user vault positions and user delegations...');
    const [userPositions, topVault, userPermittedAppVersion] = await Promise.all<any>([
      getUserPositions({ pkpInfo, chainId: baseProvider.network.chainId }),
      getTopMorphoVault(),
      getUserPermittedVersion({ appId: VINCENT_APP_ID, ethAddress: pkpInfo.ethAddress }),
    ]);

    consola.debug('Got user positions:', userPositions);
    consola.debug('Got top yielding vault:', topVault);
    consola.debug('Got user permitted app version:', userPermittedAppVersion);

    if (!userPermittedAppVersion) {
      throw new Error(
        `User ${pkpInfo.ethAddress} revoked permission to run this app. Used version to generate: ${app.version}`
      );
    }

    // Fix old jobs that didn't have app data
    if (!app) {
      app = {
        id: VINCENT_APP_ID,
        version: userPermittedAppVersion,
      };
      // eslint-disable-next-line no-param-reassign
      job.attrs.data.app = app;
      await job.save();
    }

    // Run the saved version or update to the currently permitted one if version is compatible
    const jobVersionToRun = assertJobVersion(app.version, userPermittedAppVersion);
    if (jobVersionToRun !== app.version) {
      // User updated the permitted app version after creating the job, so we need to update it
      // eslint-disable-next-line no-param-reassign
      job.attrs.data.app = { ...job.attrs.data.app, version: jobVersionToRun };
      await job.save();
    }

    let redeems: ReedemResult[] = [];
    if (userPositions) {
      const vaultsToOptimize = getVaultsToOptimize(userPositions, topVault);
      consola.debug('Vaults to optimize:', vaultsToOptimize);

      // Withdraw from vaults to optimize
      redeems = await redeemVaults({
        app,
        pkpInfo,
        provider: baseProvider,
        userVaultPositions: vaultsToOptimize,
      });
    }

    // Get user USDC balance
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      pkpInfo,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });
    const { balance, decimals } = tokenBalance;
    consola.debug('User USDC balance:', ethers.utils.formatUnits(balance, decimals));

    const deposits: DepositResult[] = [];
    if (balance.gt(MINIMUM_USDC_BALANCE * 10 ** decimals)) {
      // Put all USDC into the top vault
      const depositResult = await depositVault({
        app,
        pkpInfo,
        tokenBalance,
        provider: baseProvider,
        vault: topVault,
      });
      deposits.push(depositResult);
    }

    consola.log(
      'Job details',
      JSON.stringify(
        {
          deposits,
          pkpInfo,
          redeems,
          topVault,
          userPositions,
          userTokenBalances: [tokenBalance],
        },
        null,
        2
      )
    );
    const morphoSwap = new YieldSwap({
      deposits,
      pkpInfo,
      redeems,
      topVault,
      userPositions,
      scheduleId: _id,
      success: true,
      userTokenBalances: [tokenBalance],
    });
    await morphoSwap.save();

    consola.debug(`Successfully optimized Morpho positions for ${pkpInfo.ethAddress}`);
  } catch (e) {
    // Catch-and-rethrow is usually an anti-pattern, but Agenda doesn't log failed job reasons to console
    // so this is our chance to log the job failure details using Consola before we throw the error
    // to Agenda, which will write the failure reason to the Agenda job document in Mongo
    const err = e as Error;
    consola.error(err.message, err.stack);
    throw e;
  }
}
