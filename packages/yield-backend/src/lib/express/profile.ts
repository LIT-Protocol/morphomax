import { Response } from 'express';

import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import { PkpUser } from '../mongo/models/PkpUser';

type ProfileUpdateRequest = {
  email?: string;
  referralOtherDetails?: string;
  referralSource?: string;
};

export const handleUpdateProfileRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { email, referralOtherDetails, referralSource } = req.body as ProfileUpdateRequest;

  // Validate that at least one field is provided
  if (!email && !referralSource) {
    res.status(400).json({ error: 'At least one field (email or referralSource) is required' });
    return;
  }

  // Validate referralSource if provided
  if (referralSource) {
    const validSources = ['Telegram', 'X (Twitter)', 'Galxe', 'Blog', 'Other'];
    if (!validSources.includes(referralSource)) {
      res.status(400).json({ error: 'Invalid referral source' });
      return;
    }
  }

  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  try {
    // Build the update object dynamically based on provided fields
    const updateFields: Record<string, string | undefined> = {};

    if (email !== undefined) {
      updateFields.email = email;
    }

    if (referralSource !== undefined) {
      updateFields.referralSource = referralSource;
    }

    if (referralOtherDetails !== undefined) {
      updateFields.referralOtherDetails = referralOtherDetails;
    }

    // Use findOneAndUpdate with upsert to either create or update the profile
    const result = await PkpUser.findOneAndUpdate(
      { pkpAddress },
      { $set: updateFields },
      { new: true, runValidators: true, upsert: true }
    );

    res.status(200).json({ data: result, success: true });
  } catch (error: unknown) {
    if ((error as any)?.code === 11000) {
      // Duplicate key error
      res.status(409).json({ error: 'Profile already exists for this PKP address' });
      return;
    }
    throw error;
  }
};

export const handleGetProfileRoute = async (
  req: VincentAuthenticatedRequest,
  res: Response
): Promise<void> => {
  const pkpAddress = getPKPInfo(req.user.decodedJWT).ethAddress;

  const result = await PkpUser.findOne({ pkpAddress });

  // Return empty profile if not found
  if (!result) {
    res.status(200).json({ data: { pkpAddress }, success: true });
    return;
  }

  res.status(200).json({ data: result, success: true });
};
