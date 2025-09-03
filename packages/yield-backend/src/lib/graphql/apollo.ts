import apolloClient from '@apollo/client';
import { typePolicies } from '@morpho-org/blue-api-sdk';

const { ApolloClient, InMemoryCache } = apolloClient;

const MORPHO_GRAPHQL_URL = 'https://api.morpho.org/graphql';

// Apollo can’t serialise BigInts by default
(BigInt.prototype as any).toJSON = function BigIntToJSON() {
  return this.toString();
};

export const apollo = new ApolloClient({
  cache: new InMemoryCache({ typePolicies }),
  uri: MORPHO_GRAPHQL_URL,
});
