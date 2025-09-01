import { env } from '../../../env';

const { ALCHEMY_API_KEY, ALCHEMY_POLICY_ID } = env;

if ((ALCHEMY_API_KEY && !ALCHEMY_POLICY_ID) || (!ALCHEMY_API_KEY && ALCHEMY_POLICY_ID)) {
  throw new Error('ALCHEMY_API_KEY and ALCHEMY_POLICY_ID must be provided together');
}
const alchemyGasSponsor = !!(ALCHEMY_API_KEY && ALCHEMY_POLICY_ID);
const alchemyGasSponsorApiKey = ALCHEMY_API_KEY;
const alchemyGasSponsorPolicyId = ALCHEMY_POLICY_ID;

export { alchemyGasSponsor, alchemyGasSponsorApiKey, alchemyGasSponsorPolicyId };
