import * as Sentry from '@sentry/node';
import { ethers } from 'ethers';

import { env } from './env';

const { BASE_RPC_URL } = env;

const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BASE_MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const DEFAULT_FROM_BLOCK = 0;

const MORPHO_BASE_FACTORIES = [
  '0xFf62A7c278C62eD665133147129245053Bbf5918', // v1.1
  '0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101', // v1.0 (legacy)
];

// ====== ABIs (minimal) ======
const factoryIface = new ethers.utils.Interface([
  'event CreateMetaMorpho(address indexed metaMorpho, address indexed caller, address initialOwner, uint256 initialTimelock, address indexed asset, string name, string symbol, bytes32 salt)',
]);
const erc20Iface = new ethers.utils.Interface([
  'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
]);
const erc4626Iface = new ethers.utils.Interface(['function totalAssets() view returns (uint256)']);
const multicallIface = new ethers.utils.Interface([
  'function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])',
]);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export interface UserVaultPosition {
  address: string;
  assets: ethers.BigNumber;
  shares: ethers.BigNumber;
}

interface BalanceMonitorProps {
  depositAsset: string;
  fromBlock?: number;
}

class MorphoDepositAssetBalanceMonitor {
  private readonly depositAsset: string;

  private readonly fromBlock: number;

  private provider: ethers.providers.Provider;

  private started = false;

  private vaults = new Set<string>();

  private listeners: {
    filter: ethers.providers.Filter;
    handler: (log: ethers.providers.Log) => void;
  }[] = [];

  constructor({ depositAsset, fromBlock = DEFAULT_FROM_BLOCK }: BalanceMonitorProps) {
    this.depositAsset = depositAsset.toLowerCase();
    this.fromBlock = fromBlock;
    this.provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
  }

  /** Start: discover existing USDC vaults, then subscribe to new ones. */
  async start() {
    if (this.started) return;
    this.started = true;

    // Initial discovery
    await this.discoverCurrentVaults();

    // Live listeners
    const topicCreate = factoryIface.getEventTopic('CreateMetaMorpho');
    const assetTopic = ethers.utils.hexZeroPad(this.depositAsset, 32);

    for (const factory of MORPHO_BASE_FACTORIES) {
      const filter: ethers.providers.Filter = {
        address: factory,
        topics: [topicCreate, null, null, assetTopic],
      };
      const handler = (log: ethers.providers.Log) => {
        try {
          this.parseAndAddVault(log);
        } catch (e) {
          // Here we continue if decoding error but notify something new got past the filters
          Sentry.captureException(e);
        }
      };
      this.provider.on(filter, handler);
      this.listeners.push({ filter, handler });
    }
  }

  stop() {
    for (const { filter, handler } of this.listeners) {
      this.provider.off(filter, handler);
    }
    this.listeners = [];
    this.started = false;
  }

  /** Returns per-vault positions (shares & assets) for the user */
  async getUserPositions(userAddress: string): Promise<UserVaultPosition[]> {
    if (!this.started) {
      await this.start();
    }

    const vaults = [...this.vaults];
    if (vaults.length === 0) return [];

    // Build calls: for each vault -> balanceOf(user), totalAssets(), totalSupply()
    const vaultCalls: { callData: string; target: string }[] = [];
    for (const v of vaults) {
      vaultCalls.push({
        callData: erc20Iface.encodeFunctionData('balanceOf', [userAddress]),
        target: v,
      });
      vaultCalls.push({ callData: erc4626Iface.encodeFunctionData('totalAssets'), target: v });
      vaultCalls.push({ callData: erc20Iface.encodeFunctionData('totalSupply'), target: v });
    }

    // Multicall in chunks to avoid payload limits
    const results: { returnData: string; success: boolean }[] = [];
    const maxCallsPerBatch = 600; // 3 calls times a max of 200 vaults

    /* eslint-disable no-await-in-loop */
    for (const calls of chunk(vaultCalls, maxCallsPerBatch)) {
      const data = multicallIface.encodeFunctionData('tryAggregate', [false, calls]);
      const res = await this.provider.call({ data, to: BASE_MULTICALL3 });
      const decoded = multicallIface.decodeFunctionResult('tryAggregate', res)[0] as {
        returnData: string;
        success: boolean;
      }[];
      results.push(...decoded);
    }
    /* eslint-enable no-await-in-loop */

    // Parse results back to per-vault multiple calls
    const userVaultPositions: UserVaultPosition[] = [];
    for (let i = 0; i < vaults.length; i++) {
      const base = i * 3;
      const balanceOfResult = results[base];
      const totalAssetsResult = results[base + 1];
      const totalSupplyResult = results[base + 2];

      if (!balanceOfResult?.success || !totalAssetsResult?.success || !totalSupplyResult?.success) {
        // Something failed with this vault, inform but keep going with the others
        Sentry.captureEvent(
          {
            message: 'Error getting user position',
          },
          {
            data: {
              balanceOfResult,
              totalAssetsResult,
              totalSupplyResult,
              userAddress,
              vault: vaults[i],
            },
          }
        );
      } else {
        const shares = erc20Iface.decodeFunctionResult(
          'balanceOf',
          balanceOfResult.returnData
        )[0] as ethers.BigNumber;

        if (!shares.isZero()) {
          const totalAssets = erc4626Iface.decodeFunctionResult(
            'totalAssets',
            totalAssetsResult.returnData
          )[0] as ethers.BigNumber;
          const totalSupply = erc20Iface.decodeFunctionResult(
            'totalSupply',
            totalSupplyResult.returnData
          )[0] as ethers.BigNumber;

          const assets = totalSupply.isZero()
            ? ethers.constants.Zero
            : shares.mul(totalAssets).div(totalSupply); // ≈ convertToAssets(shares) rounding down

          userVaultPositions.push({ assets, shares, address: vaults[i] });
        }
      }
    }

    return userVaultPositions;
  }

  private parseAndAddVault(log: ethers.providers.Log) {
    const parsed = factoryIface.parseLog(log);
    const vault = ethers.utils.getAddress(parsed.args.metaMorpho as string);
    this.vaults.add(vault);
  }

  // One-shot discovery of all vaults. Should only be used at startup
  private async discoverCurrentVaults() {
    const topicCreate = factoryIface.getEventTopic('CreateMetaMorpho');
    const assetTopic = ethers.utils.hexZeroPad(BASE_USDC.toLowerCase(), 32);

    const logs: ethers.providers.Log[] = [];
    /* eslint-disable no-await-in-loop */
    for (const factory of MORPHO_BASE_FACTORIES) {
      // This will grow with time as more vaults are created but for now we are fine. When that happens we will need block based pagination
      const _logs = await this.provider.getLogs({
        address: factory,
        fromBlock: this.fromBlock,
        toBlock: 'latest',
        topics: [topicCreate, null, null, assetTopic],
      });
      logs.push(..._logs);
    }
    /* eslint-enable no-await-in-loop */

    for (const log of logs) {
      this.parseAndAddVault(log); // Do not catch and continue as in listeners, we want to let developer know filters have to be updated
    }
  }
}

export const morphoUsdcBalanceMonitor = new MorphoDepositAssetBalanceMonitor({
  depositAsset: BASE_USDC,
});
