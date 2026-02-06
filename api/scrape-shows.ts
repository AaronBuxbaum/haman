import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chromium, Browser } from 'playwright';
import { Show } from '../src/types';
import { ScraperFactory } from '../src/scrapers';

/**
 * Vercel serverless function for scraping Broadway show catalogs
 * This scrapes all registered platforms to get current lottery offerings
 */

/**
 * In-memory cache for scraped shows
 * In production, this could be Redis, DynamoDB, or another persistent cache
 */
let cachedShows: Show[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Starting show catalog scraping...');
  console.log('Request method:', req.method);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if we can use cached data
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();
  
  if (!forceRefresh && cachedShows && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    console.log('Returning cached show data');
    return res.status(200).json({
      shows: cachedShows,
      cached: true,
      cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      totalShows: cachedShows.length
    });
  }

  let browser: Browser | null = null;

  try {
    // Launch browser with anti-detection settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Use ScraperFactory to scrape all platforms
    const allShows = await ScraperFactory.scrapeAll(browser, 3000);

    // Update cache
    cachedShows = allShows;
    cacheTimestamp = now;

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
    
    // Return cached data if available, even if expired
    if (cachedShows && cachedShows.length > 0) {
      console.log('Returning stale cached data due to error');
      return res.status(200).json({
        shows: cachedShows,
        cached: true,
        stale: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalShows: cachedShows.length
      });
    }
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      shows: []
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
