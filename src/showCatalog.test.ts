import { describe, test, expect } from 'bun:test';
import { 
  getActiveShowsSync, 
  getShowsByPlatformSync, 
  getShowByNameSync,
  getBroadwayShowsSync 
} from './showCatalog';

describe('showCatalog', () => {
  describe('getActiveShows', () => {
    test('should return all active shows', () => {
      const activeShows = getActiveShowsSync();
      expect(activeShows.length).toBeGreaterThan(0);
      expect(activeShows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowsByPlatform', () => {
    test('should return only socialtoaster shows', () => {
      const shows = getShowsByPlatformSync('socialtoaster');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'socialtoaster')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });

    test('should return only broadwaydirect shows', () => {
      const shows = getShowsByPlatformSync('broadwaydirect');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'broadwaydirect')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowByName', () => {
    test('should find a show by exact name (case insensitive)', () => {
      const show = getShowByNameSync('Hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    test('should find a show by lowercase name', () => {
      const show = getShowByNameSync('hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    test('should return undefined for non-existent show', () => {
      const show = getShowByNameSync('NonExistentShow');
      expect(show).toBeUndefined();
    });
  });

  describe('getBroadwayShows', () => {
    test('should return fallback shows when no cache available', () => {
      const shows = getBroadwayShowsSync();
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.name && show.platform && show.url)).toBe(true);
    });
  });
});
