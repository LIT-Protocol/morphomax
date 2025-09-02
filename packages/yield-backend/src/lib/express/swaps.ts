import { Response } from 'express';

import { VincentAuthenticatedRequest } from './types';
import { YieldSwap } from '../mongo/models/YieldSwap';

export const handleListSwapsRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const walletAddress = req.user.decodedJWT.payload.pkpInfo.ethAddress;

  const swaps = await YieldSwap.find({ walletAddress })
    .sort({
      purchasedAt: -1,
    })
    .lean();

  res.json({ data: swaps, success: true });
};
