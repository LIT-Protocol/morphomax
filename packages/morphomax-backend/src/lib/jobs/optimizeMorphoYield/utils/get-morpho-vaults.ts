import { OrderDirection, VaultOrderBy } from '@morpho-org/blue-api-sdk';
import DataLoader from 'dataloader';
import Cache from 'node-cache';

import { baseProvider } from './chain';
import { env } from '../../../env';
import { getVaults } from '../morphoLoader';
import { wrapNodeCacheForDataloader } from './cache';

const { MINIMUM_VAULT_TOTAL_ASSETS_USD } = env;

const cache = new Cache({ checkperiod: 0, stdTTL: 10 * 60, useClones: false }); // 10 minute cache

export interface GetVaultsQueryVariables {
  first?: number;
  orderBy: VaultOrderBy;
  orderDirection: OrderDirection;
  skip?: number;
  where: {
    assetSymbol_in: string[];
    chainId_in: number[];
    totalAssetsUsd_gte: number;
    whitelisted: boolean;
  };
}

export interface MorphoVaultInfo {
  address: string;
  asset: {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
  };
  chain: {
    id: number;
    network: string;
  };
  id: string;
  name: string;
  state: {
    apy: number;
    avgApy: number;
    avgNetApy: number;
    netApy: number;
    netApyWithoutRewards: number;
  };
  symbol: string;
  whitelisted: boolean;
}

export function assertIsMorphoVaultInfo(value: unknown): asserts value is MorphoVaultInfo {
  if (!value || typeof value !== 'object') {
    throw new Error('Value must be an object');
  }

  const vault = value as MorphoVaultInfo;

  if (
    typeof vault.address !== 'string' ||
    typeof vault.id !== 'string' ||
    typeof vault.name !== 'string' ||
    typeof vault.symbol !== 'string' ||
    typeof vault.whitelisted !== 'boolean' ||
    !vault.asset ||
    typeof vault.asset.address !== 'string' ||
    typeof vault.asset.decimals !== 'number' ||
    typeof vault.asset.name !== 'string' ||
    typeof vault.asset.symbol !== 'string' ||
    !vault.chain ||
    typeof vault.chain.id !== 'number' ||
    typeof vault.chain.network !== 'string' ||
    !vault.state ||
    typeof vault.state.apy !== 'number' ||
    typeof vault.state.avgApy !== 'number' ||
    typeof vault.state.avgNetApy !== 'number' ||
    typeof vault.state.netApy !== 'number' ||
    typeof vault.state.netApyWithoutRewards !== 'number'
  ) {
    throw new Error('Invalid MorphoVaultInfo structure');
  }
}

export async function getMorphoVaults(
  queryVariables: GetVaultsQueryVariables
): Promise<MorphoVaultInfo[]> {
  const vaults = await getVaults(queryVariables);

  return vaults.map(
    (vault) =>
      ({
        address: vault.address,
        asset: {
          address: vault.asset.address,
          decimals: vault.asset.decimals,
          name: vault.asset.name,
          symbol: vault.asset.symbol,
        },
        chain: {
          id: vault.chain.id,
          network: vault.chain.network,
        },
        id: vault.id,
        name: vault.name,
        state: {
          apy: vault.state?.apy || 0,
          avgApy: vault.state?.avgApy || 0,
          avgNetApy: vault.state?.avgNetApy || 0,
          netApy: vault.state?.netApy || 0,
          netApyWithoutRewards: vault.state?.netApyWithoutRewards || 0,
        },
        symbol: vault.symbol,
        whitelisted: vault.whitelisted,
      }) as MorphoVaultInfo
  );
}

async function batchLoadFn(): Promise<{ vaults: ArrayLike<MorphoVaultInfo | Error> }[]> {
  const vaults = await getMorphoVaults({
    first: 1,
    orderBy: VaultOrderBy.NetApy,
    orderDirection: OrderDirection.Desc,
    where: {
      assetSymbol_in: ['USDC'],
      chainId_in: [baseProvider.network.chainId],
      totalAssetsUsd_gte: MINIMUM_VAULT_TOTAL_ASSETS_USD,
      whitelisted: true,
    },
  });

  return [{ vaults }];
}

const loader = new DataLoader(batchLoadFn, {
  cacheMap: wrapNodeCacheForDataloader<{ vaults: MorphoVaultInfo[] }>(cache),
});

export async function getTopMorphoVault(): Promise<MorphoVaultInfo> {
  const topVaults = (await loader.load('topVaults')).vaults;

  const topVault = topVaults[0];
  assertIsMorphoVaultInfo(topVault);

  return topVault;
}
