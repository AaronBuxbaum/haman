import { NextApiRequest, NextApiResponse } from 'next';
import { savePlatformCredentials, getPlatformCredentials, deletePlatformCredentials } from '../../src/kvStorage';

/**
 * GET /api/credentials - Get all credentials for a user
 * POST /api/credentials - Save platform credentials
 * DELETE /api/credentials - Delete platform credentials
 */

// Explicit API route configuration to ensure body parsing is enabled
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all requests
  // In Next.js, API routes and pages are typically on the same origin
  // This handles cases where the origin is explicitly set (e.g., during development or when deployed)
  const origin = req.headers.origin;
  const host = req.headers.host;
  
  // Allow requests from the same host or localhost in development
  if (origin) {
    const originUrl = new URL(origin);
    const isLocalhost = originUrl.hostname === 'localhost' || originUrl.hostname === '127.0.0.1';
    const isSameHost = host && originUrl.host === host;
    
    if (isLocalhost || isSameHost) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
