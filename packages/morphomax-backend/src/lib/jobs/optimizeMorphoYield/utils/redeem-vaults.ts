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
import { type UserVaultPositionItem } from '../morphoLoader';
import { handleOperationExecution } from './handle-operation-execution';
import { delegateeSigner } from './signer';
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
  error: string;
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
  userVaultPositions: UserVaultPositionItem[];
}): Promise<ReedemResult[]> {
  const redeemResults: ReedemResult[] = [];
  /* eslint-disable no-await-in-loop */
  // We have to trigger one redeem per vault and do it in sequence to avoid messing up the nonce
  for (const vaultPosition of userVaultPositions) {
    if (vaultPosition.state?.shares) {
      const amount = ethers.BigNumber.from(vaultPosition.state.shares);
      try {
        const redeemParams: RedeemParams = {
          alchemyGasSponsor,
          alchemyGasSponsorApiKey,
          alchemyGasSponsorPolicyId,
          amount,
          chain: provider.network.name,
          vaultAddress: vaultPosition.vault.address,
        };

        const redeemFunction = redeemFunctionMap[app.version];
        if (!redeemFunction) {
          throw new Error(`No redeem function found for app version ${app.version}`);
        }
        const redeemResult = await redeemFunction({ pkpInfo, provider, redeemParams });

        redeemResults.push(redeemResult);
      } catch (error) {
        redeemResults.push({
          amount: amount.toString(),
          error: (error as Error).message || 'Unknown error when redeeming vault shares',
          status: 'error',
          vaultAddress: vaultPosition.vault.address,
        });
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  return redeemResults;
}
