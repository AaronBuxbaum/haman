import { NextApiRequest, NextApiResponse } from 'next';
import { getActiveShows } from '../../src/showCatalog';

/**
 * POST /api/refresh-shows
 * Refresh the list of available shows from all platforms
 * 
 * NOTE: This is a placeholder. In production, this would scrape
 * the lottery platforms to discover new shows.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement actual scraping logic
    // For now, just return the current catalog
    const shows = await getActiveShows();
    
    return res.status(200).json({ 
      success: true,
      shows,
      message: `Refreshed ${shows.length} shows`,
      note: 'Scraping not yet implemented - returning current catalog'
    });
  } catch (error) {
    console.error('Error refreshing shows:', error);
    return res.status(500).json({ error: 'Failed to refresh shows' });
  }
}
