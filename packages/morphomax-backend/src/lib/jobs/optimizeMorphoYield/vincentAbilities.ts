import { ethers } from 'ethers';

import { LIT_RPC } from '@lit-protocol/constants';
import { bundledVincentAbility as erc20ApprovalAbility } from '@lit-protocol/vincent-ability-erc20-approval';
import {
  bundledVincentAbility as morphoAbility,
  MorphoOperation,
} from '@lit-protocol/vincent-ability-morpho';
import {
  getVincentAbilityClient,
  disconnectVincentAbilityClients,
} from '@lit-protocol/vincent-app-sdk/abilityClient';

import { env } from '../../env';

const { VINCENT_DELEGATEE_PRIVATE_KEY } = env;

export { disconnectVincentAbilityClients, MorphoOperation };

export const ethersSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE)
);

export function getErc20ApprovalAbilityClient() {
  return getVincentAbilityClient({
    ethersSigner,
    bundledVincentAbility: erc20ApprovalAbility,
  });
}

export function getMorphoAbilityClient() {
  return getVincentAbilityClient({
    ethersSigner,
    bundledVincentAbility: morphoAbility,
  });
}
