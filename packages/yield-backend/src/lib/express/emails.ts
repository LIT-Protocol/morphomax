import { Response } from 'express';

import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import { PkpEmail } from '../mongo/models/PkpEmail';

export const handleSubmitEmailRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  try {
    // Use findOneAndUpdate with upsert to either create or update the email
    const result = await PkpEmail.findOneAndUpdate(
      { pkpAddress },
      { email, pkpAddress },
      { new: true, upsert: true }
    );

    res.status(200).json({ data: result, success: true });
  } catch (error: unknown) {
    if ((error as any)?.code === 11000) {
      // Duplicate key error
      res.status(409).json({ error: 'Email already exists for this PKP address' });
      return;
    }
    throw error;
  }
};

export const handleGetEmailRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  const result = await PkpEmail.findOne({ pkpAddress });

  if (!result) {
    res.status(404).json({ error: 'No email found for this PKP address' });
    return;
  }

  res.status(200).json({ data: result, success: true });
};
