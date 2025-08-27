import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

import { waitForTransaction } from './wait-for-transaction';
import { waitForUserOperation } from './wait-for-user-operation';

export async function handleOperationExecution({
  isSponsored,
  operationHash,
  pkpInfo,
  provider,
}: {
  isSponsored: boolean;
  operationHash: string;
  pkpInfo: IRelayPKP;
  provider: ethers.providers.JsonRpcProvider;
}): Promise<{ txHash: string; useropHash: string | undefined }> {
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
    await waitForTransaction({ provider, transactionHash: txHash });
  }

  return { txHash, useropHash };
}
