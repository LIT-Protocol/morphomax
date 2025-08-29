import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';
import { bundledVincentAbility as erc20ApprovalAbility0012mma } from '@lit-protocol/vincent-ability-erc20-approval-0.0.12-mma';
import {
  bundledVincentAbility as MorphoAbility0012mma,
  MorphoOperation as MorphoOperation0012mma,
} from '@lit-protocol/vincent-ability-morpho-0.0.12-mma';
import {
  bundledVincentAbility as MorphoAbility0119mma,
  MorphoOperation as MorphoOperation0119mma,
} from '@lit-protocol/vincent-ability-morpho-0.1.19-mma';
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type TokenBalance } from './get-erc20-info';
import { type MorphoVaultInfo } from './get-morpho-vaults';
import { handleOperationExecution } from './handle-operation-execution';
import { delegateeSigner } from './signer';
import { type AppData } from '../../jobVersion';

type ApproveBase = {
  amount: string;
  tokenAddress: string;
};

type ApproveSuccess = ApproveBase & {
  spenderAddress: string;
  status: 'success';
  transaction: string | undefined;
  userop: string | undefined;
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
  userop: string | undefined;
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

interface EIP7702Params {
  alchemyGasSponsor: boolean;
  alchemyGasSponsorApiKey: string | undefined;
  alchemyGasSponsorPolicyId: string | undefined;
}

interface ApproveParams extends EIP7702Params {
  rpcUrl: string;
  spenderAddress: string;
  tokenAddress: string;
  tokenAmount: ethers.BigNumber;
  tokenDecimals: number;
}

interface ApproveFunctionParams {
  approveParams: ApproveParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}

interface DepositParams extends EIP7702Params {
  amount: ethers.BigNumber;
  decimals: number;
  vaultAddress: string;
}

interface DepositFunctionParams {
  depositParams: DepositParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}

function bnToNumberCeil(bn: ethers.BigNumber, decimals: number) {
  const s = ethers.utils.formatUnits(bn, decimals); // exact decimal string
  const scale = 10 ** decimals;
  return Math.ceil(Number(s) * scale) / scale; // ≥ exact, overshoots ≤ 1 unit
}

async function approveMorphoVault6({
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

  // This is what erc20 approval ability on this version requires. Fixes have been proposed to not use formatted amounts for UI
  const approvalAmount = bnToNumberCeil(approveParams.tokenAmount, approveParams.tokenDecimals);
  const fullApproveParams = {
    ...approveParams,
    chainId: provider.network.chainId,
    tokenAmount: approvalAmount,
  };

  const erc20ApprovalPrecheckResponse = await abilityClient.precheck(fullApproveParams, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  if ('error' in erc20ApprovalPrecheckResponse) {
    throw new Error(
      `ERC20 approval ability precheck failed. Response: ${JSON.stringify(erc20ApprovalPrecheckResponse, null, 2)}`
    );
  }

  const erc20ApprovalExecutionResponse = await abilityClient.execute(fullApproveParams, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  const erc20ApprovalExecutionResult = erc20ApprovalExecutionResponse.result;
  if (!('approvedAmount' in erc20ApprovalExecutionResult)) {
    throw new Error(
      `ERC20 approval ability run failed. Response: ${JSON.stringify(erc20ApprovalExecutionResponse, null, 2)}`
    );
  }

  let txHash;
  let useropHash;
  if (
    approveParams.alchemyGasSponsor &&
    'approvalTxHash' in erc20ApprovalExecutionResult &&
    typeof erc20ApprovalExecutionResult.approvalTxHash === 'string'
  ) {
    const operationHashes = await handleOperationExecution({
      pkpInfo,
      provider,
      isSponsored: fullApproveParams.alchemyGasSponsor,
      operationHash: erc20ApprovalExecutionResult.approvalTxHash as `0x${string}`,
    });
    txHash = operationHashes.txHash;
    useropHash = operationHashes.useropHash;
  } else {
    txHash = erc20ApprovalExecutionResult.approvalTxHash;
  }

  return {
    amount: erc20ApprovalExecutionResult.approvedAmount,
    spenderAddress: erc20ApprovalExecutionResult.spenderAddress,
    status: 'success',
    tokenAddress: erc20ApprovalExecutionResult.tokenAddress,
    transaction: txHash,
    userop: useropHash,
  };
}

async function approveMorphoVault27({
  approveParams,
  pkpInfo,
  provider,
}: {
  approveParams: ApproveParams;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
}): Promise<ApproveResult> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: MorphoAbility0119mma,
    ethersSigner: delegateeSigner,
  });

  const fullApproveParams = {
    alchemyGasSponsor: approveParams.alchemyGasSponsor,
    alchemyGasSponsorApiKey: approveParams.alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId: approveParams.alchemyGasSponsorPolicyId,
    amount: approveParams.tokenAmount.toString(),
    chain: provider.network.name,
    operation: MorphoOperation0119mma.APPROVE,
    vaultAddress: approveParams.spenderAddress,
  };

  const morphoDepositPrecheckResponse = await abilityClient.precheck(
    {
      ...fullApproveParams,
      rpcUrl: provider.connection.url,
    },
    {
      delegatorPkpEthAddress: pkpInfo.ethAddress,
    }
  );
  const morphoDepositPrecheckResult = morphoDepositPrecheckResponse.result;
  if (!('amountValid' in morphoDepositPrecheckResult)) {
    throw new Error(
      `Morpho approve precheck failed. Response: ${JSON.stringify(morphoDepositPrecheckResponse, null, 2)}`
    );
  }

  const morphoDepositExecutionResponse = await abilityClient.execute(
    { ...fullApproveParams, rpcUrl: '' },
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

  const { txHash, useropHash } = await handleOperationExecution({
    pkpInfo,
    provider,
    isSponsored: fullApproveParams.alchemyGasSponsor,
    operationHash: morphoDepositExecutionResult.txHash as `0x${string}`,
  });

  return {
    amount: morphoDepositExecutionResult.amount,
    spenderAddress: fullApproveParams.vaultAddress,
    status: 'success',
    tokenAddress: approveParams.tokenAddress,
    transaction: txHash,
    userop: useropHash,
  };
}

const approveFunctionMap: Record<
  number,
  (params: ApproveFunctionParams) => Promise<ApproveResult>
> = {
  6: approveMorphoVault6,
  27: approveMorphoVault27,
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

  const { amount, decimals, ...rest } = depositParams;
  const amountToDeposit = ethers.utils.formatUnits(amount, decimals);
  const fullDepositParams = {
    ...rest,
    amount: amountToDeposit,
    chain: provider.network.name,
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
      `Morpho deposit precheck failed. Response: ${JSON.stringify(morphoDepositPrecheckResponse, null, 2)}`
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

  const { txHash, useropHash } = await handleOperationExecution({
    pkpInfo,
    provider,
    isSponsored: fullDepositParams.alchemyGasSponsor,
    operationHash: morphoDepositExecutionResult.txHash as `0x${string}`,
  });

  return {
    amount: morphoDepositExecutionResult.amount,
    status: 'success',
    transaction: txHash,
    userop: useropHash,
    vaultAddress: morphoDepositExecutionResult.vaultAddress,
  };
}

async function depositMorphoVault27({
  depositParams,
  pkpInfo,
  provider,
}: DepositFunctionParams): Promise<DepositSuccess> {
  const abilityClient = getVincentAbilityClient({
    bundledVincentAbility: MorphoAbility0119mma,
    ethersSigner: delegateeSigner,
  });

  const { amount, decimals, ...rest } = depositParams;
  const fullDepositParams = {
    ...rest,
    amount: amount.toString(),
    chain: provider.network.name,
    operation: MorphoOperation0119mma.DEPOSIT,
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
      `Morpho deposit precheck failed. Response: ${JSON.stringify(morphoDepositPrecheckResponse, null, 2)}`
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

  const { txHash, useropHash } = await handleOperationExecution({
    pkpInfo,
    provider,
    isSponsored: fullDepositParams.alchemyGasSponsor,
    operationHash: morphoDepositExecutionResult.txHash as `0x${string}`,
  });

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
  27: depositMorphoVault27,
} as const;

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
  const approveParams: ApproveParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    rpcUrl: provider.connection.url,
    spenderAddress: vault.address,
    tokenAddress: tokenBalance.address,
    tokenAmount: tokenBalance.balance,
    tokenDecimals: tokenBalance.decimals,
  };

  const approveFunction = approveFunctionMap[app.version];
  if (!approveFunction) {
    throw new Error(`No approve function found for app version ${app.version}`);
  }
  const approveResult = await approveFunction({ approveParams, pkpInfo, provider });

  const depositParams: DepositParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    amount: tokenBalance.balance,
    decimals: tokenBalance.decimals,
    // bundlerStepsLimit: 1,
    // skipRevertOnPermit: true,
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
