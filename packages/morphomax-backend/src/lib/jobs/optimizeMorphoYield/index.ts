import { optimizeMorphoYield } from './optimizeMorphoYield';

import type { JobType, JobParams } from './optimizeMorphoYield';

export const jobName = 'morpho-max';
export const processJob = optimizeMorphoYield;
export type { JobType, JobParams };
