import { z } from 'zod';

import { ScheduleIdentitySchema, ScheduleParamsSchema } from './schema';

import type { AuthenticatedRequest } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

export type VincentAuthenticatedRequest = AuthenticatedRequest<'user'>;

export type ScheduleParams = z.infer<typeof ScheduleParamsSchema>;

export type ScheduleIdentity = z.infer<typeof ScheduleIdentitySchema>;
