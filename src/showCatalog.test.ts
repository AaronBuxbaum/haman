import { getActiveShows, getShowsByPlatform, getShowByName } from './showCatalog';

describe('showCatalog', () => {
  describe('getActiveShows', () => {
    it('should return all active shows', () => {
      const activeShows = getActiveShows();
      expect(activeShows.length).toBeGreaterThan(0);
      expect(activeShows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowsByPlatform', () => {
    it('should return only socialtoaster shows', () => {
      const shows = getShowsByPlatform('socialtoaster');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'socialtoaster')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });

    it('should return only broadwaydirect shows', () => {
      const shows = getShowsByPlatform('broadwaydirect');
      expect(shows.length).toBeGreaterThan(0);
      expect(shows.every(show => show.platform === 'broadwaydirect')).toBe(true);
      expect(shows.every(show => show.active)).toBe(true);
    });
  });

  describe('getShowByName', () => {
    it('should find a show by exact name (case insensitive)', () => {
      const show = getShowByName('Hamilton');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hamilton');
    });

    it('should find a show by lowercase name', () => {
      const show = getShowByName('hamilton');
      expect(show).toBeDefined();
      expect(show?.name).toBe('Hamilton');
    });

    it('should return undefined for non-existent show', () => {
      const show = getShowByName('NonExistentShow');
      expect(show).toBeUndefined();
    });
  });
});
