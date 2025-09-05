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
  const vaults: VaultItem[] = [];

  const requested = vars.first || Number.MAX_SAFE_INTEGER;
  let offset = 0;
  let requestNextPage = true;

  /* eslint-disable no-await-in-loop */
  do {
    const { data } = await apollo.query<GetVaultsQuery, GetVaultsQueryVariables>({
      query: GetVaultsDocument,
      variables: { ...vars, skip: offset },
    });

    vaults.push(...(data.vaults.items || []));

    const { count, countTotal, limit, skip } = data.vaults.pageInfo || {
      count: 0,
      countTotal: 0,
      limit: 0,
      skip: 0,
    };
    offset += limit;
    requestNextPage = vaults.length < requested && count + skip < countTotal;
  } while (requestNextPage);
  /* eslint-enable no-await-in-loop */

  return vaults;
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
