import { Show } from './types';
import { getCachedShows } from './kvStorage';

/**
 * Broadway show catalog with database caching
 * 
 * IMPORTANT: No fallback shows - if scraping fails and no cache exists, 
 * an error will be returned to the user.
 * 
 * Shows are cached in the database (Vercel KV) and updated:
 * - On demand via /api/refresh-shows
 * - Automatically via daily cron job at /api/refresh-shows-cron (8:00 AM EST)
 * 
 * EXTENSIBILITY NOTES:
 * - Additional lottery platforms can be added by extending the 'platform' type
 * - Dynamic catalog updates are implemented via the /api/scrape-shows endpoint
 * - New automation classes should be created in lotteryAutomation.ts for each platform
 */

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours (matches daily cron schedule)

/**
 * Fetch shows from the scraper API
 * @param forceRefresh - Force a refresh of the data, bypassing cache
 * @returns Promise resolving to array of shows
 * @throws Error if API fails and no cache is available
 */
async function fetchShowsFromAPI(forceRefresh: boolean = false): Promise<Show[]> {
  try {
    // First, try to get from database cache
    if (!forceRefresh) {
      const cached = await getCachedShows();
      const now = Date.now();
      if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
        console.log(`Returning database-cached shows (${cached.shows.length} shows, age: ${Math.floor((now - cached.timestamp) / 1000)}s)`);
        return cached.shows;
      }
    }

    // Cache is stale or forceRefresh requested - fetch from API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.API_BASE_URL || 'http://localhost:3000';
    
    const url = `${baseUrl}/api/scrape-shows${forceRefresh ? '?refresh=true' : ''}`;
    
    console.log(`Fetching shows from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(45000) // 45 second timeout
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as { shows?: Show[]; error?: string; [key: string]: unknown };
    
    if (data.error) {
      throw new Error(data.error);
    }

    if (data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
      console.log(`Successfully fetched ${data.shows.length} shows from API`);
      return data.shows;
    } else {
      throw new Error('API returned empty or invalid show data');
    }
  } catch (error) {
    console.error('Error fetching shows from API:', error);
    
    // Try to return stale cache as last resort
    const cached = await getCachedShows();
    if (cached && cached.shows.length > 0) {
      const age = Math.floor((Date.now() - cached.timestamp) / 1000);
      console.warn(`Returning stale cached shows (${cached.shows.length} shows, age: ${age}s) due to API error`);
      return cached.shows;
    }
    
    // No cache available - throw error
    throw new Error('Failed to fetch shows: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get all Broadway shows (from database cache or API)
 * Uses database caching to minimize API calls
 * @throws Error if no shows are available
 */
export async function getBroadwayShows(forceRefresh: boolean = false): Promise<Show[]> {
  return await fetchShowsFromAPI(forceRefresh);
}

/**
 * Get cached shows from database only (does not trigger API fetch)
 * @throws Error if no cache is available
 * Use this when you need immediate access to shows without triggering a scrape.
 * Prefer getBroadwayShows() whenever possible to ensure fresh data.
 */
export async function getBroadwayShowsFromCache(): Promise<Show[]> {
  const cached = await getCachedShows();
  if (cached && cached.shows.length > 0) {
    return cached.shows;
  }
  throw new Error('No cached shows available. Please call /api/refresh-shows to fetch shows.');
}


/**
 * Get all active shows
 */
export async function getActiveShows(): Promise<Show[]> {
  const shows = await getBroadwayShows();
  return shows.filter(show => show.active);
}

/**
 * Get all active shows (from cache only)
 * @throws Error if no cache is available
 */
export async function getActiveShowsFromCache(): Promise<Show[]> {
  const shows = await getBroadwayShowsFromCache();
  return shows.filter(show => show.active);
}

/**
 * Get shows by platform
 */
export async function getShowsByPlatform(platform: 'socialtoaster' | 'broadwaydirect'): Promise<Show[]> {
  const shows = await getBroadwayShows();
  return shows.filter(show => show.active && show.platform === platform);
}

/**
 * Get shows by platform (from cache only)
 * @throws Error if no cache is available
 */
export async function getShowsByPlatformFromCache(platform: 'socialtoaster' | 'broadwaydirect'): Promise<Show[]> {
  const shows = await getBroadwayShowsFromCache();
  return shows.filter(show => show.active && show.platform === platform);
}

/**
 * Get show by name
 */
export async function getShowByName(name: string): Promise<Show | undefined> {
  const shows = await getBroadwayShows();
  return shows.find(
    show => show.name.toLowerCase() === name.toLowerCase() && show.active
  );
}

/**
 * Get show by name (from cache only)
 * @throws Error if no cache is available
 */
export async function getShowByNameFromCache(name: string): Promise<Show | undefined> {
  const shows = await getBroadwayShowsFromCache();
  return shows.find(
    show => show.name.toLowerCase() === name.toLowerCase() && show.active
  );
}

