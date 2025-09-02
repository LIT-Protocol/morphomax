import { getTopMorphoVault } from '../jobs/optimizeMorphoYield/utils';

import type { RequestHandler, Request, Response } from 'express';

export const handleGetTopStrategyRoute: RequestHandler = async (req: Request, res: Response) => {
  const topVault = await getTopMorphoVault();

  res.json({ data: topVault, success: true });
};
