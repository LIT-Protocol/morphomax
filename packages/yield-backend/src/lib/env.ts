import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

import { intervalMap } from './agenda/frequencies';

// Ref: https://github.com/t3-oss/t3-env/pull/145
const booleanStrings = ['true', 'false', true, false, '1', '0', 'yes', 'no', 'y', 'n', 'on', 'off'];
const BooleanOrBooleanStringSchema = z
  .any()
  .refine((val) => booleanStrings.includes(val), { message: 'must be boolean' })
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      if (['true', 'yes', 'y', '1', 'on'].includes(normalized)) return true;
      if (['false', 'no', 'n', '0', 'off'].includes(normalized)) return false;
      throw new Error(`Invalid boolean string: "${val}"`);
    }
    throw new Error(`Expected boolean or boolean string, got: ${typeof val}`);
  });

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: process.env,
  server: {
    AGENDA_DEFAULT_CONCURRENCY: z.coerce.number().default(5),
    AGENDA_DEFAULT_LOCKLIMIT: z.coerce.number().default(5),
    ALCHEMY_API_KEY: z.string().optional(),
    ALCHEMY_POLICY_ID: z.string().optional(),
    ALLOWED_AUDIENCE: z.string().url(),
    BASE_RPC_URL: z.string().url().optional(),
    CORS_ALLOWED_DOMAINS: z.string().transform((val) => val.split(',')),
    DEFAULT_TX_CONFIRMATIONS: z.coerce.number().default(6),
    GALXE_API_KEY: z.string().optional(),
    IS_DEVELOPMENT: BooleanOrBooleanStringSchema,
    MINIMUM_USDC_BALANCE: z.coerce.number(),
    MINIMUM_VAULT_TOTAL_ASSETS_USD: z.coerce.number().default(1_000_000),
    MINIMUM_YIELD_IMPROVEMENT_PERCENT: z.coerce.number(),
    MONGODB_URI: z.string().url(),
    NEW_SCHEDULE_FREQUENCY: z.nativeEnum(intervalMap).default('1 week'),
    PORT: z.coerce.number(),
    SENTRY_DSN: z.string().optional(),
    VINCENT_APP_ID: z.coerce.number(),
    VINCENT_DELEGATEE_PRIVATE_KEY: z.string(),
  },
});
