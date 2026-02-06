import { Show } from './types';

/**
 * Fallback Broadway show catalog (used when scraping is unavailable)
 * 
 * EXTENSIBILITY NOTES:
 * - Additional lottery platforms can be added by extending the 'platform' type
 * - Dynamic catalog updates are now implemented via the /api/scrape-shows endpoint
 * - New automation classes should be created in lotteryAutomation.ts for each platform
 * 
 * This fallback catalog is used when:
 * - The scraper API is unavailable
 * - Running in local development without the API
 * - As a safety net during API failures
 */
const FALLBACK_SHOWS: Show[] = [
  // SocialToaster shows (fallback)
  {
    name: 'Hamilton',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/hamilton',
    genre: 'musical',
    active: true
  },
  {
    name: 'Wicked',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/wicked',
    genre: 'musical',
    active: true
  },
  {
    name: 'The Lion King',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/lion-king',
    genre: 'musical',
    active: true
  },
  // BroadwayDirect shows (fallback)
  {
    name: 'Book of Mormon',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/book-of-mormon',
    genre: 'musical',
    active: true
  },
  {
    name: 'Chicago',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/chicago',
    genre: 'musical',
    active: true
  },
  {
    name: 'Moulin Rouge',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/moulin-rouge',
    genre: 'musical',
    active: true
  }
];

/**
 * In-memory cache for scraped shows
 */
let cachedShows: Show[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch shows from the scraper API
 * @param forceRefresh - Force a refresh of the data, bypassing cache
 * @returns Promise resolving to array of shows
 */
async function fetchShowsFromAPI(forceRefresh: boolean = false): Promise<Show[]> {
  try {
    // Determine the base URL for the API
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

    const data = await response.json() as { shows?: Show[]; [key: string]: unknown };
    
    if (data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
      console.log(`Successfully fetched ${data.shows.length} shows from API`);
      return data.shows;
    } else {
      console.warn('API returned empty or invalid show data');
      return FALLBACK_SHOWS;
    }
  } catch (error) {
    console.error('Error fetching shows from API:', error);
    console.log('Falling back to hard-coded show catalog');
    return FALLBACK_SHOWS;
  }
}

/**
 * Get all Broadway shows (from API or fallback)
 * Uses caching to minimize API calls
 */
export async function getBroadwayShows(forceRefresh: boolean = false): Promise<Show[]> {
  const now = Date.now();
  
  // Return cached data if available and not expired
  if (!forceRefresh && cachedShows && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    console.log('Returning cached show data');
    return cachedShows;
  }

  // Fetch fresh data
  const shows = await fetchShowsFromAPI(forceRefresh);
  
  // Update cache
  cachedShows = shows;
  cacheTimestamp = now;
  
  return shows;
}

/**
 * Synchronous version that returns cached or fallback data
 * Use this when you need immediate access and can't await
 */
export function getBroadwayShowsSync(): Show[] {
  if (cachedShows) {
    return cachedShows;
  }
  return FALLBACK_SHOWS;
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use getBroadwayShows() or getBroadwayShowsSync() instead
 */
export const BROADWAY_SHOWS = FALLBACK_SHOWS;

/**
 * Get all active shows
 */
export async function getActiveShows(): Promise<Show[]> {
  const shows = await getBroadwayShows();
  return shows.filter(show => show.active);
}

/**
 * Get all active shows (synchronous version)
 */
export function getActiveShowsSync(): Show[] {
  const shows = getBroadwayShowsSync();
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
 * Get shows by platform (synchronous version)
 */
export function getShowsByPlatformSync(platform: 'socialtoaster' | 'broadwaydirect'): Show[] {
  const shows = getBroadwayShowsSync();
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
 * Get show by name (synchronous version)
 */
export function getShowByNameSync(name: string): Show | undefined {
  const shows = getBroadwayShowsSync();
  return shows.find(
    show => show.name.toLowerCase() === name.toLowerCase() && show.active
  );
}

