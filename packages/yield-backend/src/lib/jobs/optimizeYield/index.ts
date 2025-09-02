import { optimizeYield } from './optimizeYield';

import type { JobType, JobParams } from './optimizeYield';

export const jobName = 'morpho-max'; // TODO https://linear.app/litprotocol/issue/DREL-996/heroku-vercel-db-migration
export const processJob = optimizeYield;
export type { JobType, JobParams };
