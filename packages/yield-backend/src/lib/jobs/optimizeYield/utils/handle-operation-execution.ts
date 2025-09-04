import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { waitForTransaction } from './wait-for-transaction';
import { waitForUserOperation } from './wait-for-user-operation';
import { env } from '../../../env';

const { DEFAULT_TX_CONFIRMATIONS } = env;

export async function handleOperationExecution({
  confirmations = DEFAULT_TX_CONFIRMATIONS,
  isSponsored,
  operationHash,
  pkpInfo,
  provider,
}: {
  confirmations?: number;
  isSponsored: boolean;
  operationHash: `0x${string}`;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.JsonRpcProvider;
}): Promise<{ txHash: `0x${string}`; useropHash: `0x${string}` | undefined }> {
  let txHash;
  let useropHash;
  if (!isSponsored) {
    txHash = operationHash;
  } else {
    useropHash = operationHash;
    txHash = await waitForUserOperation({
      provider,
      useropHash,
      pkpPublicKey: pkpInfo.publicKey,
    });
    await waitForTransaction({ confirmations, provider, transactionHash: txHash });
  }

  return { txHash, useropHash };
}
