import { ethers } from 'ethers';

import { IRelayPKP } from '@lit-protocol/types';

export interface TokenBalance {
  address: string;
  balance: ethers.BigNumber;
  decimals: number;
}

const ERC20_ABI = [
  'function balanceOf(address owner) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
];

export function getERC20Contract(address: string, provider: ethers.providers.JsonRpcProvider) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

export async function getERC20Balance({
  pkpInfo,
  provider,
  tokenAddress,
}: {
  pkpInfo: IRelayPKP;
  provider: ethers.providers.StaticJsonRpcProvider;
  tokenAddress: string;
}): Promise<TokenBalance> {
  const usdcContract = getERC20Contract(tokenAddress, provider);

  const [balance, decimals] = await Promise.all([
    usdcContract.balanceOf(pkpInfo.ethAddress),
    usdcContract.decimals(),
  ]);

  return {
    balance,
    decimals,
    address: tokenAddress,
  };
}
