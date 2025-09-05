import * as Sentry from '@sentry/node';
import { Job } from '@whisthub/agenda';
import consola from 'consola';
import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertJobVersion } from '../jobVersion';
import {
  DepositResult,
  ReedemResult,
  baseProvider,
  depositVault,
  getAddressesByChainId,
  getERC20Balance,
  getMorphoVaults,
  getTopMorphoVault,
  getUserPermittedVersion,
  redeemVaults,
} from './utils';
import { type MorphoVaultInfo } from './utils/get-morpho-vaults';
import { type UserVaultPosition, morphoUsdcBalanceMonitor } from '../../balanceMonitor';
import { env } from '../../env';
import { normalizeError } from '../../error';
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

async function getVaultsToOptimize(
  userVaultPositions: UserVaultPosition[],
  topVault: MorphoVaultInfo
): Promise<UserVaultPosition[]> {
  const morphoVaultsData = await getMorphoVaults({
    where: {
      address_in: userVaultPositions.map((uvp) => uvp.address),
      assetSymbol_in: null,
      chainId_in: null,
      totalAssetsUsd_gte: 0,
      whitelisted: null,
    },
  });

  // TODO improve this calculation
  // Consider the following stuff:
  // - estimated earning in period
  // - performance and management fees
  // - yield in other tokens
  // - gas cost
  const topVaultNetApy = topVault.state?.netApy || 0;
  const vaultsToOptimize = userVaultPositions.filter((vp) => {
    const vaultInfo = morphoVaultsData.find((vault) => vault.address === vp.address);
    // If there is no vault info, we will try to redeem it anyway, hence the negative infinity
    return (
      topVaultNetApy >
      (vaultInfo?.state?.netApy || Number.NEGATIVE_INFINITY) +
        MINIMUM_YIELD_IMPROVEMENT_PERCENT / 100
    );
  });

  return vaultsToOptimize;
}

export async function optimizeYield(job: JobType, sentryScope: Sentry.Scope): Promise<void> {
  const {
    _id,
    data: { pkpInfo },
  } = job.attrs;
  let { app } = job.attrs.data;

  consola.log('Starting yield optimization job...', {
    _id,
    pkpInfo,
  });

  try {
    consola.debug('Fetching current top strategy, user vault positions and user delegations...');
    const [userVaultPositions, topVault, userPermittedAppVersion] = await Promise.all([
      morphoUsdcBalanceMonitor.getUserPositions(pkpInfo.ethAddress),
      getTopMorphoVault(),
      getUserPermittedVersion({ appId: VINCENT_APP_ID, ethAddress: pkpInfo.ethAddress }),
    ]);

    consola.debug('Got user vault positions:', userVaultPositions);
    consola.debug('Got top yielding vault:', topVault);
    consola.debug('Got user permitted app version:', userPermittedAppVersion);

    if (!topVault) {
      throw new Error('No top vault found. Morpho API might be down.');
    }
    if (!userPermittedAppVersion) {
      throw new Error(
        `User ${pkpInfo.ethAddress} revoked permission to run this app. Used version to generate: ${app.version}`
      );
    }

    // Fix old jobs that didn't have app data
    if (!app?.version) {
      sentryScope.addBreadcrumb({
        data: {
          app,
          userPermittedAppVersion,
        },
        message: 'No app data found in job',
      });
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
      sentryScope.addBreadcrumb({
        data: {
          app,
          jobVersionToRun,
          userPermittedAppVersion,
        },
        message: `User updated the permitted app version after creating the job`,
      });
      // eslint-disable-next-line no-param-reassign
      job.attrs.data.app = { ...job.attrs.data.app, version: jobVersionToRun };
      await job.save();
    }

    let redeems: ReedemResult[] = [];
    const vaultsToOptimize = await getVaultsToOptimize(userVaultPositions, topVault);
    consola.debug('Vaults to optimize:', vaultsToOptimize);

    // Withdraw from vaults to optimize
    const allRedeems = await redeemVaults({
      app,
      pkpInfo,
      provider: baseProvider,
      userVaultPositions: vaultsToOptimize,
    });
    redeems = allRedeems.filter((redeem) => {
      if (redeem.status !== 'success') {
        const { error, ...rest } = redeem;
        sentryScope.captureException(error, {
          data: {
            redeem: { ...rest },
          },
        });
        return false;
      }
      return true;
    });

    // Get user USDC balance
    const { USDC_ADDRESS } = getAddressesByChainId(baseProvider.network.chainId);
    const tokenBalance = await getERC20Balance({
      pkpInfo,
      provider: baseProvider,
      tokenAddress: USDC_ADDRESS,
    });
    const { balance, decimals } = tokenBalance;
    consola.debug('User USDC balance:', ethers.utils.formatUnits(balance, decimals));
    sentryScope.addBreadcrumb({
      data: {
        tokenBalance,
      },
      message: 'User USDC balance',
    });

    // Deposits is an array to future-proof in case we want to make multiple deposits (stables vs not, multiple chains, etc.)
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

      if (depositResult.deposit?.status === 'success') {
        deposits.push(depositResult);
      } else if (depositResult.approval.status === 'error') {
        // What failed is the approval
        const { error, ...rest } = depositResult.approval;
        sentryScope.captureException(error, {
          data: {
            approval: { ...rest },
          },
        });
      } else if (depositResult.deposit?.status === 'error') {
        // What failed is the deposit
        const { error, ...rest } = depositResult.deposit;
        sentryScope.captureException(error, {
          data: {
            approval: depositResult.approval,
            deposit: { ...rest },
          },
        });
      } else {
        // WUT? Something else failed...
        sentryScope.captureException(new Error('Unknown deposit error'), {
          data: {
            approval: depositResult.approval,
            deposit: depositResult.deposit,
          },
        });
      }
    }

    consola.log(
      'Job details',
      JSON.stringify(
        {
          deposits,
          pkpInfo,
          redeems,
          topVault,
          userVaultPositions,
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
      userVaultPositions,
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
    const err = normalizeError(e);
    sentryScope.captureException(err);
    consola.error(err.message, err.stack);
    throw e;
  }
}
