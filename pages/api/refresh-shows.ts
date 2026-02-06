import { NextApiRequest, NextApiResponse } from 'next';
import { getBroadwayShows } from '../../src/showCatalog';

/**
 * POST /api/refresh-shows
 * Refresh the list of available shows from all platforms
 * 
 * This endpoint triggers a refresh of the show catalog by calling
 * the scraper API with forceRefresh=true, which will scrape all
 * registered platforms for current lottery offerings.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Force refresh the show catalog by calling getBroadwayShows with forceRefresh=true
    // This will internally call the scraper API to fetch fresh data
    const shows = await getBroadwayShows(true);
    
    return res.status(200).json({ 
      success: true,
      shows,
      message: `Refreshed ${shows.length} shows from all platforms`,
    });
  } catch (error) {
    console.error('Error refreshing shows:', error);
    return res.status(500).json({ error: 'Failed to refresh shows' });
  }
}
