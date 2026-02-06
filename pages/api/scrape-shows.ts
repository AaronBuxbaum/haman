import { NextApiRequest, NextApiResponse } from 'next';
import { chromium, Browser } from 'playwright';
import { ScraperFactory } from '../../src/scrapers';
import { getCachedShows, setCachedShows } from '../../src/kvStorage';

/**
 * API endpoint for scraping Broadway show catalogs
 * This scrapes all registered platforms to get current lottery offerings
 * GET /api/scrape-shows?refresh=true
 * 
 * Shows are cached in the database (Vercel KV) and updated:
 * - On demand via ?refresh=true
 * - Automatically via daily cron job at 8:00 AM EST
 */

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (matches daily cron schedule)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Starting show catalog scraping...');
  console.log('Request method:', req.method);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if we can use cached data from database
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();
  
  if (!forceRefresh) {
    const cached = await getCachedShows();
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      console.log('Returning database-cached show data');
      return res.status(200).json({
        shows: cached.shows,
        cached: true,
        cacheAge: Math.floor((now - cached.timestamp) / 1000),
        totalShows: cached.shows.length
      });
    }
  }

  let browser: Browser | null = null;

  try {
    // Launch browser with anti-detection settings
    // These flags are necessary for scraping public lottery websites:
    // - --disable-web-security: Required to bypass CORS when scraping cross-origin resources
    //   from lottery platforms that don't allow programmatic access
    // - --no-sandbox/--disable-setuid-sandbox: Required for running Chrome in serverless environments
    //   where sandboxing is not available (Vercel, AWS Lambda, etc.)
    // - Other flags: Hide automation detection to ensure scrapers work reliably
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security', // See security note above
        '--disable-dev-shm-usage',
        '--no-sandbox', // Required for serverless
        '--disable-setuid-sandbox' // Required for serverless
      ]
    });

    // Use ScraperFactory to scrape all platforms
    const allShows = await ScraperFactory.scrapeAll(browser, 3000);

    if (allShows.length === 0) {
      throw new Error('No shows were scraped from any platform');
    }

    // Update database cache
    await setCachedShows(allShows);

    console.log(`Successfully scraped ${allShows.length} total shows`);

    return res.status(200).json({
      shows: allShows,
      cached: false,
      totalShows: allShows.length,
      breakdown: allShows.reduce((acc, show) => {
        const platform = show.platform === 'socialtoaster' ? 'luckyseat' : show.platform;
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

  } catch (error) {
    console.error('Error in show scraping:', error);
    
    // Return stale cached data if available as a fallback
    const cached = await getCachedShows();
    if (cached && cached.shows.length > 0) {
      console.log('Returning stale database-cached data due to scraping error');
      return res.status(200).json({
        shows: cached.shows,
        cached: true,
        stale: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalShows: cached.shows.length,
        cacheAge: Math.floor((now - cached.timestamp) / 1000)
      });
    }
    
    // No cache available - return error
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to scrape shows and no cache available',
      shows: []
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
