import { 
  getActiveShowsSync, 
  getShowsByPlatformSync, 
  getShowByNameSync,
  getBroadwayShowsSync 
} from './showCatalog';

describe('showCatalog', () => {
  describe('getActiveShows', () => {
    it('should return all active shows', () => {
      const activeShows = getActiveShowsSync();
      expect(activeShows.length).toBeGreaterThan(0);
      expect(activeShows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowsByPlatform', () => {
    it('should return only socialtoaster shows', () => {
      const shows = getShowsByPlatformSync('socialtoaster');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'socialtoaster')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });

    it('should return only broadwaydirect shows', () => {
      const shows = getShowsByPlatformSync('broadwaydirect');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'broadwaydirect')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowByName', () => {
    it('should find a show by exact name (case insensitive)', () => {
      const show = getShowByNameSync('Hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    it('should find a show by lowercase name', () => {
      const show = getShowByNameSync('hadestown');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hadestown');
    });

    it('should return undefined for non-existent show', () => {
      const show = getShowByNameSync('NonExistentShow');
      expect(show).toBeUndefined();
    });
  });

  describe('getBroadwayShows', () => {
    it('should return fallback shows when no cache available', () => {
      const shows = getBroadwayShowsSync();
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.name && show.platform && show.url)).toBe(true);
    });
  });
});
