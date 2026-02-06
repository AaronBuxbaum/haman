import { NextApiRequest, NextApiResponse } from 'next';
import { setUserOverride, deleteUserOverride } from '../../src/kvStorage';

/**
 * POST /api/override
 * Set or delete a user override for a show
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, showName, platform, shouldApply } = req.body;

    if (!userId || !showName || !platform) {
      return res.status(400).json({ error: 'userId, showName, and platform are required' });
    }

    if (typeof shouldApply === 'undefined' || shouldApply === null) {
      // Delete override if shouldApply is not provided
      await deleteUserOverride(userId, showName, platform);
      return res.status(200).json({ success: true, deleted: true });
    }

    // Set override
    const override = await setUserOverride(userId, showName, platform, shouldApply);
    return res.status(200).json({ success: true, override });
  } catch (error) {
    console.error('Error setting override:', error);
    return res.status(500).json({ error: 'Failed to set override' });
  }
}
