import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';
import { bundledVincentAbility as erc20ApprovalAbility0012mma } from '@lit-protocol/vincent-ability-erc20-approval-0.0.12-mma';
import {
  bundledVincentAbility as MorphoAbility0012mma,
  MorphoOperation as MorphoOperation0012mma,
} from '@lit-protocol/vincent-ability-morpho-0.0.12-mma';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type TokenBalance } from './get-erc20-info';
import { type MorphoVaultInfo } from './get-morpho-vaults';
import { delegateeSigner } from './signer';
import { waitForTransaction } from './wait-for-transaction';
import { waitForUserOperation } from './wait-for-user-operation';
import { type AppData } from '../../jobVersion';

type ApproveBase = {
  amount: string;
  tokenAddress: string;
};

type ApproveSuccess = ApproveBase & {
  spenderAddress: string;
  status: 'success';
  tokenDecimals: number;
  transaction?: string;
  userop?: string;
};

type ApproveError = ApproveBase & {
  error: string;
  status: 'error';
};

type ApproveResult = ApproveSuccess | ApproveError;

type DepositBase = {
  amount: string;
  vaultAddress: string;
};

type DepositSuccess = DepositBase & {
  status: 'success';
  transaction: string;
  userop?: string;
};

type DepositError = DepositBase & {
  error: string;
  status: 'error';
};

type InnerDepositResult = DepositSuccess | DepositError;

export type DepositResult = {
  approval: ApproveResult;
  deposit: InnerDepositResult;
};

interface ApproveParams {
  alchemyGasSponsor: string;
  alchemyGasSponsorApiKey: string;
  alchemyGasSponsorPolicyId: string;
  amount: string;
  chain: string;
  spenderAddress: string;
  tokenAddress: string;
  tokenAmount: number;
  tokenDecimals: number;
}

interface ApproveFunctionParams {
  approveParams: ApproveParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}

interface DepositParams {
  alchemyGasSponsor: string;
  alchemyGasSponsorApiKey: string;
  alchemyGasSponsorPolicyId: string;
  amount: string;
  chain: string;
  vaultAddress: string;
}

interface DepositFunctionParams {
  depositParams: DepositParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}

async function approveMorphoVaultv6({
  approveParams,
  pkpInfo,
  provider,
}: {
  approveParams: ApproveParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}): Promise<ApproveResult> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: erc20ApprovalAbility0012mma,
    ethersSigner: delegateeSigner,
  });

  const erc20ApprovalPrecheckResponse = await abilityClient.precheck(approveParams, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  if ('error' in erc20ApprovalPrecheckResponse) {
    throw new Error(
      `ERC20 approval ability precheck failed. Response: ${JSON.stringify(erc20ApprovalPrecheckResponse, null, 2)}`
    );
  }

  const erc20ApprovalExecutionResponse = await abilityClient.execute(approveParams, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  const erc20ApprovalExecutionResult = erc20ApprovalExecutionResponse.result;
  if (!('approvedAmount' in erc20ApprovalExecutionResult)) {
    throw new Error(
      `ERC20 approval ability run failed. Response: ${JSON.stringify(erc20ApprovalExecutionResponse, null, 2)}`
    );
  }

  let txHash; let useropHash;
  if (
    approveParams.alchemyGasSponsor &&
    'approvalTxHash' in erc20ApprovalExecutionResult &&
    typeof erc20ApprovalExecutionResult.approvalTxHash === 'string'
  ) {
    useropHash = erc20ApprovalExecutionResult.approvalTxHash;
    txHash = await waitForUserOperation({
      provider,
      pkpPublicKey: pkpInfo.publicKey,
      useropHash: erc20ApprovalExecutionResult.approvalTxHash,
    });
    await waitForTransaction({ provider, transactionHash: txHash });
  } else {
    txHash = erc20ApprovalExecutionResult.approvalTxHash;
  }

  return {
    amount: erc20ApprovalExecutionResult.approvedAmount,
    spenderAddress: erc20ApprovalExecutionResult.spenderAddress,
    status: 'success',
    tokenAddress: erc20ApprovalExecutionResult.tokenAddress,
    tokenDecimals: erc20ApprovalExecutionResult.tokenDecimals,
    transaction: txHash,
    userop: useropHash,
  };
}

const approveFunctionMap: Record<
  number,
  (params: ApproveFunctionParams) => Promise<ApproveSuccess>
> = {
  6: approveMorphoVaultv6,
} as const;

async function depositMorphoVault6({
  depositParams,
  pkpInfo,
  provider,
}: DepositFunctionParams): Promise<DepositSuccess> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: MorphoAbility0012mma,
    ethersSigner: delegateeSigner,
  });

  const fullDepositParams = {
    ...depositParams,
    operation: MorphoOperation0012mma.DEPOSIT,
  };

  const morphoDepositPrecheckResponse = await abilityClient.precheck(
    {
      ...fullDepositParams,
      rpcUrl: provider.connection.url,
    },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoDepositPrecheckResult = morphoDepositPrecheckResponse.result;
  if (!('amountValid' in morphoDepositPrecheckResult)) {
    throw new Error(
      `Morpho redeem precheck failed. Response: ${JSON.stringify(morphoDepositPrecheckResponse, null, 2)}`
    );
  }

  const morphoDepositExecutionResponse = await abilityClient.execute(
    { ...fullDepositParams, rpcUrl: '' },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoDepositExecutionResult = morphoDepositExecutionResponse.result;
  if (!('txHash' in morphoDepositExecutionResult)) {
    throw new Error(
      `Morpho deposit ability run failed. Response: ${JSON.stringify(morphoDepositExecutionResponse, null, 2)}`
    );
  }

  let txHash; let useropHash;
  if (!depositParams.alchemyGasSponsor) {
    txHash = morphoDepositExecutionResult.txHash;
  } else {
    useropHash = morphoDepositExecutionResult.txHash;
    txHash = await waitForUserOperation({
      provider,
      pkpPublicKey: pkpInfo.publicKey,
      useropHash: morphoDepositExecutionResult.txHash,
    });
    await waitForTransaction({ provider, transactionHash: txHash });
  }

  return {
    amount: morphoDepositExecutionResult.amount,
    status: 'success',
    transaction: txHash,
    userop: useropHash,
    vaultAddress: morphoDepositExecutionResult.vaultAddress,
  };
}

const depositFunctionMap: Record<
  number,
  (params: DepositFunctionParams) => Promise<DepositSuccess>
> = {
  6: depositMorphoVault6,
} as const;

function bnToNumberCeil(bn: ethers.BigNumber, decimals: number) {
  const s = ethers.utils.formatUnits(bn, decimals); // exact decimal string
  const scale = 10 ** decimals;
  return Math.ceil(Number(s) * scale) / scale; // ≥ exact, overshoots ≤ 1 unit
}

export async function depositVault({
  app,
  pkpInfo,
  provider,
  tokenBalance,
  vault,
}: {
  app: AppData;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.JsonRpcProvider;
  tokenBalance: TokenBalance;
  vault: MorphoVaultInfo;
}): Promise<DepositResult> {
  // This is what erc20 approval ability currently requires. It should be updated to use strings without decimal places
  const approvalAmount = bnToNumberCeil(tokenBalance.balance, tokenBalance.decimals);

  const approveParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    chainId: provider.network.chainId,
    rpcUrl: provider.connection.url,
    spenderAddress: vault.address,
    tokenAddress: tokenBalance.address,
    tokenAmount: approvalAmount,
    tokenDecimals: tokenBalance.decimals,
  };

  const approveFunction = approveFunctionMap[app.version];
  if (!approveFunction) {
    throw new Error(`No approve function found for app version ${app.version}`);
  }
  const approveResult = await approveFunction({ approveParams, pkpInfo, provider });

  const amountToDeposit = ethers.utils.formatUnits(
    tokenBalance.balance.toString(),
    tokenBalance.decimals
  );

  const depositParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    amount: amountToDeposit,
    // bundlerStepsLimit: 1,
    // skipRevertOnPermit: true,
    chain: provider.network.name,
    vaultAddress: vault.address as string,
  };

  const depositFunction = depositFunctionMap[app.version];
  if (!depositFunction) {
    throw new Error(`No deposit function found for app version ${app.version}`);
  }
  const depositResult = await depositFunction({ depositParams, pkpInfo, provider });

  return {
    approval: approveResult,
    deposit: depositResult,
  };
}
