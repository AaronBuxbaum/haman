import { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { getBroadwayShows } from '../../src/showCatalog';

/**
 * API endpoint for refreshing Broadway shows catalog via cron job
 * This can be triggered via HTTP request or scheduled via Vercel cron
 * POST /api/refresh-shows-cron
 * 
 * This endpoint forces a refresh of the show catalog from all platforms
 * and updates the database cache.
 * 
 * Scheduled to run daily at 8:00 AM EST (for Hobby plan compatibility)
 */

/**
 * Timing-safe comparison of authorization tokens
 * Prevents timing attacks by ensuring constant-time comparison
 */
function isAuthorized(authHeader: string | undefined, expectedSecret: string | undefined): boolean {
  if (!authHeader || !expectedSecret) {
    return false;
  }
  
  const expectedAuth = `Bearer ${expectedSecret}`;
  
  // Ensure both strings are same length for timingSafeEqual
  if (authHeader.length !== expectedAuth.length) {
    return false;
  }
  
  try {
    const authBuffer = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expectedAuth);
    return timingSafeEqual(authBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Starting scheduled show catalog refresh...');
  console.log('Request method:', req.method);

  // Verify authorization for manual triggers
  const authHeader = req.headers.authorization;
  const cronHeader = req.headers['x-vercel-cron'];
  
  // Allow requests from Vercel cron or with valid authorization
  if (!cronHeader && !isAuthorized(authHeader, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Force refresh the show catalog by calling getBroadwayShows with forceRefresh=true
    // This will internally call the scraper API to fetch fresh data and update the database cache
    const shows = await getBroadwayShows(true);
    
    return res.status(200).json({ 
      success: true,
      shows,
      message: `Refreshed ${shows.length} shows from all platforms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing shows:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to refresh shows',
      timestamp: new Date().toISOString(),
    });
  }
}
