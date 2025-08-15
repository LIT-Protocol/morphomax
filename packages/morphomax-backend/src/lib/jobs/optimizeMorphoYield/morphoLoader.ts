import { apollo } from '../../graphql/apollo';
import {
  GetUserPositionsDocument,
  GetVaultsDocument,
  type GetUserPositionsQuery,
  type GetUserPositionsQueryVariables,
  type GetVaultsQuery,
  type GetVaultsQueryVariables,
} from '../../graphql/generated';

export type VaultItem = NonNullable<GetVaultsQuery['vaults']['items']>[number];
export const getVaults = async (vars: GetVaultsQueryVariables): Promise<VaultItem[]> => {
  const { data } = await apollo.query<GetVaultsQuery, GetVaultsQueryVariables>({
    query: GetVaultsDocument,
    variables: vars,
  });

  const vaults = data.vaults.items;

  return vaults || [];
};

export type UserPositionItem = NonNullable<
  GetUserPositionsQuery['vaultPositions']['items']
>[number];
export type UserVaultPositionItem = NonNullable<UserPositionItem['user']['vaultPositions']>[number];
export const getUsersPositions = async (
  vars: GetUserPositionsQueryVariables
): Promise<UserPositionItem[]> => {
  const { data } = await apollo.query<GetUserPositionsQuery, GetUserPositionsQueryVariables>({
    query: GetUserPositionsDocument,
    variables: vars,
  });
  const usersVaultPositions = data.vaultPositions.items;

  return usersVaultPositions || [];
};
