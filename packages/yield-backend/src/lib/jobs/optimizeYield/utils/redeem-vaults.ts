import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';
import {
  bundledVincentAbility as bundledVincentAbility0012mma,
  MorphoOperation as MorphoOperation0012mma,
} from '@lit-protocol/vincent-ability-morpho-0.0.12-mma';
import {
  bundledVincentAbility as bundledVincentAbility0119mma,
  MorphoOperation as MorphoOperation0119mma,
} from '@lit-protocol/vincent-ability-morpho-0.1.19-mma';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { handleOperationExecution } from './handle-operation-execution';
import { delegateeSigner } from './signer';
import { type UserVaultPosition } from '../../../balanceMonitor';
import { normalizeError } from '../../../error';
import { AppData } from '../../jobVersion';

type RedeemBase = {
  amount: string;
  vaultAddress: string;
};

type RedeemSuccess = RedeemBase & {
  status: 'success';
  transaction: string;
  userop: string | undefined;
};

type RedeemError = RedeemBase & {
  error: Error;
  status: 'error';
};

export type ReedemResult = RedeemSuccess | RedeemError;

interface RedeemParams {
  alchemyGasSponsor: boolean;
  alchemyGasSponsorApiKey: string | undefined;
  alchemyGasSponsorPolicyId: string | undefined;
  amount: ethers.BigNumber;
  chain: string;
  vaultAddress: string;
}

interface RedeemFunctionParams {
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
  redeemParams: RedeemParams;
}

async function redeemVault6({
  pkpInfo,
  provider,
  redeemParams,
}: RedeemFunctionParams): Promise<RedeemSuccess> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: bundledVincentAbility0012mma,
    ethersSigner: delegateeSigner,
  });

  // Vaults are ERC-4626 compliant, They will always have 18 decimals
  const formattedAmount = ethers.utils.formatUnits(redeemParams.amount, 18);
  const fullRedeemParams = {
    ...redeemParams,
    amount: formattedAmount,
    operation: MorphoOperation0012mma.REDEEM,
  };

  const morphoReedemPrecheckResponse = await abilityClient.precheck(
    { ...fullRedeemParams, rpcUrl: provider.connection.url },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoRedeemPrecheckResult = morphoReedemPrecheckResponse.result;
  if (!('amountValid' in morphoRedeemPrecheckResult)) {
    throw new Error(
      `Morpho redeem precheck failed. Response: ${JSON.stringify(morphoReedemPrecheckResponse, null, 2)}`
    );
  }

  const morphoReedemExecutionResponse = await abilityClient.execute(
    { ...fullRedeemParams, rpcUrl: '' },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoRedeemExecutionResult = morphoReedemExecutionResponse.result;
  if (
    !(
      morphoRedeemExecutionResult &&
      'txHash' in morphoRedeemExecutionResult &&
      typeof morphoRedeemExecutionResult.txHash === 'string'
    )
  ) {
    throw new Error(
      `Morpho redeem execution failed. Response: ${JSON.stringify(morphoReedemExecutionResponse, null, 2)}`
    );
  }

  const { txHash, useropHash } = await handleOperationExecution({
    pkpInfo,
    provider,
    isSponsored: fullRedeemParams.alchemyGasSponsor,
    operationHash: morphoRedeemExecutionResult.txHash as `0x${string}`,
  });

  return {
    amount: morphoRedeemExecutionResult.amount,
    status: 'success',
    transaction: txHash,
    userop: useropHash,
    vaultAddress: morphoRedeemExecutionResult.vaultAddress,
  };
}

async function redeemVault27({
  pkpInfo,
  provider,
  redeemParams,
}: RedeemFunctionParams): Promise<RedeemSuccess> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: bundledVincentAbility0119mma,
    ethersSigner: delegateeSigner,
  });

  const fullRedeemParams = {
    ...redeemParams,
    amount: redeemParams.amount.toString(),
    operation: MorphoOperation0119mma.REDEEM,
  };

  const morphoReedemPrecheckResponse = await abilityClient.precheck(
    { ...fullRedeemParams, rpcUrl: provider.connection.url },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoRedeemPrecheckResult = morphoReedemPrecheckResponse.result;
  if (!('amountValid' in morphoRedeemPrecheckResult)) {
    throw new Error(
      `Morpho redeem precheck failed. Response: ${JSON.stringify(morphoReedemPrecheckResponse, null, 2)}`
    );
  }

  const morphoReedemExecutionResponse = await abilityClient.execute(
    { ...fullRedeemParams, rpcUrl: '' },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoRedeemExecutionResult = morphoReedemExecutionResponse.result;
  if (
    !(
      morphoRedeemExecutionResult &&
      'txHash' in morphoRedeemExecutionResult &&
      typeof morphoRedeemExecutionResult.txHash === 'string'
    )
  ) {
    throw new Error(
      `Morpho redeem execution failed. Response: ${JSON.stringify(morphoReedemExecutionResponse, null, 2)}`
    );
  }

  const { txHash, useropHash } = await handleOperationExecution({
    pkpInfo,
    provider,
    isSponsored: fullRedeemParams.alchemyGasSponsor,
    operationHash: morphoRedeemExecutionResult.txHash as `0x${string}`,
  });

  return {
    amount: morphoRedeemExecutionResult.amount,
    status: 'success',
    transaction: txHash,
    userop: useropHash,
    vaultAddress: morphoRedeemExecutionResult.vaultAddress,
  };
}

const redeemFunctionMap: Record<number, (params: RedeemFunctionParams) => Promise<ReedemResult>> = {
  6: redeemVault6,
  27: redeemVault27,
} as const;

export async function redeemVaults({
  app,
  pkpInfo,
  provider,
  userVaultPositions,
}: {
  app: AppData;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
  userVaultPositions: UserVaultPosition[];
}): Promise<ReedemResult[]> {
  const redeemResults: ReedemResult[] = [];
  /* eslint-disable no-await-in-loop */
  // We have to trigger one redeem per vault and do it in sequence to avoid messing up the nonce
  // In most cases, we will only have one vault to redeem. The only cases where we will have multiple are when users transfer other vault tokens to their wallet
  for (const userVaultPosition of userVaultPositions) {
    if (userVaultPosition.shares.gt(0)) {
      try {
        const redeemParams: RedeemParams = {
          alchemyGasSponsor,
          alchemyGasSponsorApiKey,
          alchemyGasSponsorPolicyId,
          amount: userVaultPosition.shares,
          chain: provider.network.name,
          vaultAddress: userVaultPosition.address,
        };

        const redeemFunction = redeemFunctionMap[app.version];
        if (!redeemFunction) {
          redeemResults.push({
            amount: userVaultPosition.shares.toString(),
            error: normalizeError(`No redeem function found for app version ${app.version}`),
            status: 'error',
            vaultAddress: userVaultPosition.address,
          } as RedeemError);
        } else {
          const redeemResult = await redeemFunction({ pkpInfo, provider, redeemParams });

          redeemResults.push(redeemResult);
        }
      } catch (e) {
        redeemResults.push({
          amount: userVaultPosition.shares.toString(),
          error: normalizeError(e),
          status: 'error',
          vaultAddress: userVaultPosition.address,
        });
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  return redeemResults;
}
