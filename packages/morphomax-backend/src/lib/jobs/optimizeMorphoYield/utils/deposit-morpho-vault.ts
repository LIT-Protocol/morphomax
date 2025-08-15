import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';
import { type VaultItem } from '../morphoLoader';
import { type TokenBalance } from './get-erc20-info';
import { waitForTransaction } from './wait-for-transaction';
import { waitForUserOperation } from './wait-for-user-operation';
import {
  getErc20ApprovalAbilityClient,
  getMorphoAbilityClient,
  MorphoOperation,
} from '../vincentAbilities';

export async function depositMorphoVault({
  pkpInfo,
  provider,
  tokenBalance,
  vault,
}: {
  pkpInfo: IRelayPKP;
  provider: ethers.providers.JsonRpcProvider;
  tokenBalance: TokenBalance;
  vault: VaultItem;
}) {
  const erc20ApprovalAbilityClient = getErc20ApprovalAbilityClient();
  const morphoAbilityClient = getMorphoAbilityClient();

  const erc20Params = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    chainId: provider.network.chainId,
    rpcUrl: provider.connection.url,
    spenderAddress: vault.address,
    tokenAddress: tokenBalance.address,
    tokenAmount: tokenBalance.balance.toNumber(),
    tokenDecimals: tokenBalance.decimals,
  };
  const erc20ApprovalPrecheckResponse = await erc20ApprovalAbilityClient.precheck(erc20Params, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  if ('error' in erc20ApprovalPrecheckResponse) {
    throw new Error(
      `ERC20 approval ability precheck failed. Response: ${JSON.stringify(erc20ApprovalPrecheckResponse, null, 2)}`
    );
  }

  const erc20ApprovalExecutionResponse = await erc20ApprovalAbilityClient.execute(erc20Params, {
    delegatorPkpEthAddress: pkpInfo.ethAddress,
  });
  const erc20ApprovalExecutionResult = erc20ApprovalExecutionResponse.result;
  if (!('approvedAmount' in erc20ApprovalExecutionResult)) {
    throw new Error(
      `ERC20 approval ability run failed. Response: ${JSON.stringify(erc20ApprovalExecutionResponse, null, 2)}`
    );
  }
  if (
    'approvalTxHash' in erc20ApprovalExecutionResult &&
    typeof erc20ApprovalExecutionResult.approvalTxHash === 'string'
  ) {
    const bundledTxHash = await waitForUserOperation({
      provider,
      pkpPublicKey: pkpInfo.publicKey,
      useropHash: erc20ApprovalExecutionResult.approvalTxHash,
    });
    await waitForTransaction({ provider, transactionHash: bundledTxHash });
  }

  const amountToDeposit = ethers.utils.formatUnits(
    tokenBalance.balance.toString(),
    tokenBalance.decimals
  );

  const morphoDepositParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    amount: amountToDeposit,
    chain: provider.network.name,
    operation: MorphoOperation.DEPOSIT,
    vaultAddress: vault.address as string,
  };
  const morphoDepositPrecheckResponse = await morphoAbilityClient.precheck(
    {
      ...morphoDepositParams,
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

  const morphoDepositExecutionResponse = await morphoAbilityClient.execute(
    { ...morphoDepositParams, rpcUrl: '' },
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
  const bundledTxHash = await waitForUserOperation({
    provider,
    pkpPublicKey: pkpInfo.publicKey,
    useropHash: morphoDepositExecutionResult.txHash,
  });
  await waitForTransaction({ provider, transactionHash: bundledTxHash });

  return {
    approval: erc20ApprovalExecutionResult,
    deposit: morphoDepositExecutionResult,
  };
}
