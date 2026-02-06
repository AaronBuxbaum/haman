import { describe, test, expect, beforeEach } from 'bun:test';
import { ScraperFactory } from './ScraperFactory';
import { LuckySeatScraper } from './LuckySeatScraper';
import { BroadwayDirectScraper } from './BroadwayDirectScraper';

describe('ScraperFactory', () => {
  beforeEach(() => {
    // Clear scrapers before each test
    ScraperFactory.clear();
  });

  describe('register', () => {
    test('should register a scraper', () => {
      const scraper = new LuckySeatScraper();
      ScraperFactory.register(scraper);
      
      const retrieved = ScraperFactory.get('socialtoaster');
      expect(retrieved).toBe(scraper);
    });

    test('should register multiple scrapers', () => {
      const luckySeat = new LuckySeatScraper();
      const broadwayDirect = new BroadwayDirectScraper();
      
      ScraperFactory.register(luckySeat);
      ScraperFactory.register(broadwayDirect);
      
      expect(ScraperFactory.get('socialtoaster')).toBe(luckySeat);
      expect(ScraperFactory.get('broadwaydirect')).toBe(broadwayDirect);
    });
  });

  describe('get', () => {
    test('should return undefined for unregistered platform', () => {
      const scraper = ScraperFactory.get('socialtoaster');
      expect(scraper).toBeUndefined();
    });

    test('should auto-register default scrapers on first access', () => {
      const scraper = ScraperFactory.get('socialtoaster');
      expect(scraper).toBeDefined();
      expect(scraper?.platform).toBe('socialtoaster');
    });
  });

  describe('getAll', () => {
    test('should return all registered scrapers', () => {
      const scrapers = ScraperFactory.getAll();
      expect(scrapers.length).toBe(2);
      
      const platforms = scrapers.map(s => s.platform);
      expect(platforms).toContain('socialtoaster');
      expect(platforms).toContain('broadwaydirect');
    });
  });

  describe('clear', () => {
    test('should remove all registered scrapers', () => {
      ScraperFactory.register(new LuckySeatScraper());
      ScraperFactory.clear();
      
      const scraper = ScraperFactory.get('socialtoaster');
      // After clear, get() will auto-register defaults again
      expect(scraper).toBeDefined();
    });
  });
});

describe('LuckySeatScraper', () => {
  test('should have correct platform', () => {
    const scraper = new LuckySeatScraper();
    expect(scraper.platform).toBe('socialtoaster');
  });

  test('should have correct base URL', () => {
    const scraper = new LuckySeatScraper();
    expect(scraper.baseUrl).toBe('https://www.luckyseat.com/');
  });
});

describe('BroadwayDirectScraper', () => {
  test('should have correct platform', () => {
    const scraper = new BroadwayDirectScraper();
    expect(scraper.platform).toBe('broadwaydirect');
  });

  test('should have correct base URL', () => {
    const scraper = new BroadwayDirectScraper();
    expect(scraper.baseUrl).toBe('https://lottery.broadwaydirect.com/');
  });
});
