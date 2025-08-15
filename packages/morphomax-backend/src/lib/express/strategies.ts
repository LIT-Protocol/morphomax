import { Response } from 'express';

import { getTopMorphoVault } from '../jobs/optimizeMorphoYield/utils';

export const handleGetTopStrategyRoute = async (req: Request, res: Response) => {
  const topVault = await getTopMorphoVault();

  res.json({ data: topVault, success: true });
};
