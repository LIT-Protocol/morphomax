import type { AuthenticatedRequest } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

export const userKey = 'user' as const;

export type VincentAuthenticatedRequest = AuthenticatedRequest<typeof userKey>;
