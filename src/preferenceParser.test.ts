import { PreferenceParser } from './preferenceParser';
import { ParsedPreferences } from './types';

describe('PreferenceParser', () => {
  describe('matchesPreferences', () => {
    let parser: PreferenceParser;

    beforeEach(() => {
      // We don't need a real API key for testing matchesPreferences
      parser = new PreferenceParser('fake-api-key');
    });

    describe('with specific show names', () => {
      it('should match when show name is in preferences', () => {
        const show = { name: 'Hamilton', genre: 'musical' };
        const preferences: ParsedPreferences = {
          showNames: ['Hamilton']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should match with partial name (case insensitive)', () => {
        const show = { name: 'The Book of Mormon', genre: 'musical' };
        const preferences: ParsedPreferences = {
          showNames: ['book of mormon']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should not match when show name is not in preferences', () => {
        const show = { name: 'Wicked', genre: 'musical' };
        const preferences: ParsedPreferences = {
          showNames: ['Hamilton']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });
    });

    describe('with exclude list', () => {
      it('should not match excluded shows', () => {
        const show = { name: 'Cats', genre: 'musical' };
        const preferences: ParsedPreferences = {
          excludeShows: ['Cats']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });

      it('should match shows not in exclude list', () => {
        const show = { name: 'Hamilton', genre: 'musical' };
        const preferences: ParsedPreferences = {
          excludeShows: ['Cats', 'Phantom']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should exclude with partial name match (case insensitive)', () => {
        const show = { name: 'The Phantom of the Opera', genre: 'musical' };
        const preferences: ParsedPreferences = {
          excludeShows: ['phantom']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });
    });

    describe('with genre preferences', () => {
      it('should match when genre matches', () => {
        const show = { name: 'Hamilton', genre: 'musical' };
        const preferences: ParsedPreferences = {
          genres: ['musical']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should not match when genre does not match', () => {
        const show = { name: 'A Play', genre: 'drama' };
        const preferences: ParsedPreferences = {
          genres: ['musical']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });

      it('should match with partial genre match', () => {
        const show = { name: 'Show', genre: 'musical comedy' };
        const preferences: ParsedPreferences = {
          genres: ['musical']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should match if no genre specified in preferences', () => {
        const show = { name: 'Show', genre: 'drama' };
        const preferences: ParsedPreferences = {
          // No genres specified
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should match if show has no genre but preferences do not require it', () => {
        const show = { name: 'Show' };
        const preferences: ParsedPreferences = {
          genres: ['musical']
        };

        // Should still match because the logic only checks genre if show has one
        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });
    });

    describe('combined preferences', () => {
      it('should match when all criteria are met', () => {
        const show = { name: 'Hamilton', genre: 'musical' };
        const preferences: ParsedPreferences = {
          showNames: ['Hamilton'],
          genres: ['musical'],
          excludeShows: ['Cats']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });

      it('should not match when excluded even if other criteria match', () => {
        const show = { name: 'Hamilton', genre: 'musical' };
        const preferences: ParsedPreferences = {
          genres: ['musical'],
          excludeShows: ['Hamilton']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });

      it('should not match when show name does not match even if genre matches', () => {
        const show = { name: 'Wicked', genre: 'musical' };
        const preferences: ParsedPreferences = {
          showNames: ['Hamilton'],
          genres: ['musical']
        };

        expect(parser.matchesPreferences(show, preferences)).toBe(false);
      });
    });

    describe('with empty preferences', () => {
      it('should match any show with empty preferences', () => {
        const show = { name: 'Any Show', genre: 'any' };
        const preferences: ParsedPreferences = {};

        expect(parser.matchesPreferences(show, preferences)).toBe(true);
      });
    });
  });
});
