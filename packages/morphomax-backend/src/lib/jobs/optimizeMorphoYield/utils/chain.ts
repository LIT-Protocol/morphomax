import { ethers } from 'ethers';

import { LIT_EVM_CHAINS } from '@lit-protocol/constants';

import { env } from '../../../env';

export const { BASE_RPC_URL } = env;

const BASE_NAME = 'base';
const BASE_CHAIN_ID = 8453;
const baseRpcUrl = BASE_RPC_URL || LIT_EVM_CHAINS[BASE_NAME].rpcUrls[0];

export const baseProvider = new ethers.providers.StaticJsonRpcProvider(baseRpcUrl, {
  chainId: BASE_CHAIN_ID,
  name: BASE_NAME,
});
