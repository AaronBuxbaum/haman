import { Show } from './types';

/**
 * Broadway show catalog
 * 
 * EXTENSIBILITY NOTES:
 * - Additional lottery platforms can be added by extending the 'platform' type
 * - Dynamic catalog updates can be implemented by replacing this static array
 *   with database queries or API calls
 * - New automation classes should be created in lotteryAutomation.ts for each platform
 * 
 * In production, this would be dynamically updated from various sources
 */
export const BROADWAY_SHOWS: Show[] = [
  // SocialToaster shows (example URLs - these would need to be actual lottery URLs)
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
  // BroadwayDirect shows (example URLs)
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
 * Get all active shows
 */
export function getActiveShows(): Show[] {
  return BROADWAY_SHOWS.filter(show => show.active);
}

/**
 * Get shows by platform
 */
export function getShowsByPlatform(platform: 'socialtoaster' | 'broadwaydirect'): Show[] {
  return BROADWAY_SHOWS.filter(show => show.active && show.platform === platform);
}

/**
 * Get show by name
 */
export function getShowByName(name: string): Show | undefined {
  return BROADWAY_SHOWS.find(
    show => show.name.toLowerCase() === name.toLowerCase() && show.active
  );
}
