import type { AuthenticatedRequest } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

export type VincentAuthenticatedRequest = AuthenticatedRequest<'user'>;
