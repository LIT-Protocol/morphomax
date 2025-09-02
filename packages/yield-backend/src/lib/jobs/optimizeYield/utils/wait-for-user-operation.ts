import consola from 'consola';
import { ethers } from 'ethers';

import { waitForUserOp } from '@lit-protocol/vincent-scaffold-sdk';

import { alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId } from './alchemy';

export async function waitForUserOperation({
  pkpPublicKey,
  provider,
  useropHash,
}: {
  pkpPublicKey: string;
  provider: ethers.providers.JsonRpcProvider;
  useropHash: `0x${string}`;
}) {
  if (!alchemyGasSponsorApiKey || !alchemyGasSponsorPolicyId) {
    throw new Error('Alchemy API key and policy ID are required when working with UserOps');
  }

  const bundleTxHash = await waitForUserOp({
    pkpPublicKey,
    chainId: provider.network.chainId,
    eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
    eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
    userOp: useropHash,
  });

  consola.log('UserOp confirmed:', bundleTxHash);

  return bundleTxHash;
}
