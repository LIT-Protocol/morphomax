import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { readOnlySigner } from './signer';

export async function getUserPermittedVersion({
  appId,
  ethAddress,
}: {
  appId: number;
  ethAddress: string;
}): Promise<number | null> {
  const client = getClient({ signer: readOnlySigner });

  const version = await client.getPermittedAppVersionForPkp({
    appId,
    pkpEthAddress: ethAddress,
  });

  return version;
}
