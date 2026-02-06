import { describe, test, expect, beforeAll } from 'bun:test';
import { 
  getActiveShowsSync, 
  getShowsByPlatformSync, 
  getShowByNameSync,
  getBroadwayShowsSync
} from './showCatalog';
import { setCachedShows } from './kvStorage';
import { Show } from './types';

// Mock shows for testing
const mockShows: Show[] = [
  {
    name: 'Hadestown',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/shows/hadestown-newyork',
    genre: 'musical',
    active: true
  },
  {
    name: 'Wicked',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/wicked/',
    genre: 'musical',
    active: true
  },
  {
    name: 'The Lion King',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/the-lion-king/',
    genre: 'musical',
    active: true
  },
];

describe('showCatalog', () => {
  // Set up mock cache before all tests
  beforeAll(async () => {
    await setCachedShows(mockShows);
  });

  describe('getActiveShows', () => {
    test('should return all active shows from cache', async () => {
      const activeShows = await getActiveShowsSync();
      expect(activeShows.length).toBeGreaterThan(0);
      expect(activeShows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowsByPlatform', () => {
    test('should return only socialtoaster shows', async () => {
      const shows = await getShowsByPlatformSync('socialtoaster');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'socialtoaster')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });

    test('should return only broadwaydirect shows', async () => {
      const shows = await getShowsByPlatformSync('broadwaydirect');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'broadwaydirect')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowByName', () => {
    test('should find a show by exact name (case insensitive)', async () => {
      const show = await getShowByNameSync('Hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    test('should find a show by lowercase name', async () => {
      const show = await getShowByNameSync('hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    test('should return undefined for non-existent show', async () => {
      const show = await getShowByNameSync('NonExistentShow');
      expect(show).toBeUndefined();
    });
  });

  describe('getBroadwayShows', () => {
    test('should return cached shows when cache is available', async () => {
      const shows = await getBroadwayShowsSync();
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.name && show.platform && show.url)).toBe(true);
    });
  });
});
