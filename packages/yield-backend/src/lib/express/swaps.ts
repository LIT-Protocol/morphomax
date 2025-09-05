import { Response } from 'express';

import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import { YieldSwap } from '../mongo/models/YieldSwap';

export const handleListSwapsRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const { ethAddress } = getPKPInfo(req.user.decodedJWT);

  const swaps = await YieldSwap.find({ walletAddress: ethAddress })
    .sort({
      purchasedAt: -1,
    })
    .lean();

  res.json({ data: swaps, success: true });
};
