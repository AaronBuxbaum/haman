import { NextApiRequest, NextApiResponse } from 'next';
import { savePlatformCredentials, getPlatformCredentials, deletePlatformCredentials } from '../../src/kvStorage';

/**
 * GET /api/credentials - Get all credentials for a user
 * POST /api/credentials - Save platform credentials
 * DELETE /api/credentials - Delete platform credentials
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (req.method === 'GET') {
      // Get all credentials for the user
      const socialToasterCreds = await getPlatformCredentials(userId, 'socialtoaster');
      const broadwayDirectCreds = await getPlatformCredentials(userId, 'broadwaydirect');
      
      // Don't send encrypted passwords to client
      const sanitized = {
        socialtoaster: socialToasterCreds.map(c => ({
          email: c.email,
          platform: c.platform,
        })),
        broadwaydirect: broadwayDirectCreds.map(c => ({
          email: c.email,
          platform: c.platform,
        })),
      };

      return res.status(200).json({ credentials: sanitized });
    }

    if (req.method === 'POST') {
      const { platform, email, password } = req.body;

      if (!platform || !email || !password) {
        return res.status(400).json({ error: 'platform, email, and password are required' });
      }

      if (platform !== 'socialtoaster' && platform !== 'broadwaydirect') {
        return res.status(400).json({ error: 'Invalid platform' });
      }

      await savePlatformCredentials(userId, platform, email, password);
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { platform, email } = req.body;

      if (!platform || !email) {
        return res.status(400).json({ error: 'platform and email are required' });
      }

      await deletePlatformCredentials(userId, platform, email);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error managing credentials:', error);
    return res.status(500).json({ error: 'Failed to manage credentials' });
  }
}
