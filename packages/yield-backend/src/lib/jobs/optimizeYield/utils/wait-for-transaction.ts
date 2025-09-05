import consola from 'consola';
import { ethers } from 'ethers';

import { env } from '../../../env';

const { DEFAULT_TX_CONFIRMATIONS } = env;

export async function waitForTransaction({
  confirmations = DEFAULT_TX_CONFIRMATIONS,
  provider,
  transactionHash,
}: {
  confirmations?: number;
  provider: ethers.providers.JsonRpcProvider;
  transactionHash: string;
}) {
  const receipt = await provider.waitForTransaction(transactionHash, confirmations);
  if (receipt.status === 1) {
    consola.log('Transaction confirmed:', transactionHash);
  } else {
    consola.error('Transaction failed:', transactionHash);
    throw new Error(`Transaction failed for hash: ${transactionHash}`);
  }
}
