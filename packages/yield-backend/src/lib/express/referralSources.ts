import { Response } from 'express';

import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import { PkpUser } from '../mongo/models/PkpUser';

export const handleSubmitReferralSourceRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { otherDetails, source } = req.body;

  if (!source) {
    res.status(400).json({ error: 'Source is required' });
    return;
  }

  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  try {
    // Use findOneAndUpdate with upsert to either create or update the referral source
    const result = await PkpUser.findOneAndUpdate(
      { pkpAddress },
      { $set: { referralOtherDetails: otherDetails, referralSource: source } },
      { new: true, upsert: true }
    );

    res.status(200).json({ data: result, success: true });
  } catch (error: unknown) {
    if ((error as any)?.code === 11000) {
      // Duplicate key error
      res.status(409).json({ error: 'Referral source already exists for this PKP address' });
      return;
    }
    throw error;
  }
};

export const handleGetReferralSourceRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  const result = await PkpUser.findOne({ pkpAddress });

  if (!result || !result.referralSource) {
    res.status(404).json({ error: 'No referral source found for this PKP address' });
    return;
  }

  res.status(200).json({ data: result, success: true });
};
