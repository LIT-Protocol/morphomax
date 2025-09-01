import { IRelayPKP } from '@lit-protocol/types';

import { getUsersPositions, type UserPositionItem } from '../morphoLoader';

export async function getUserPositions({
  chainId,
  pkpInfo,
}: {
  chainId: number;
  pkpInfo: IRelayPKP;
}): Promise<UserPositionItem | undefined> {
  const usersPositions = await getUsersPositions({
    where: {
      chainId_in: [chainId],
      shares_gte: 1, // Only consider vaults with more than 1 share. This field is an integer so it is basically asking for more than 0
      userAddress_in: [pkpInfo.ethAddress],
    },
  });
  const userPositions = usersPositions[0]; // Applying the userAddress_in filter should return only one user

  return userPositions;
}
