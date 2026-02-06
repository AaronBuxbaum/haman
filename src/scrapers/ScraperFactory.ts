import { Browser } from 'playwright';
import { PlatformScraper } from './types';
import { LuckySeatScraper } from './LuckySeatScraper';
import { BroadwayDirectScraper } from './BroadwayDirectScraper';
import { Show } from '../types';

/**
 * Factory for creating and managing platform scrapers
 */
export class ScraperFactory {
  private static scrapers: Map<string, PlatformScraper> = new Map();

  /**
   * Register default scrapers
   */
  private static registerDefaults() {
    if (this.scrapers.size === 0) {
      this.register(new LuckySeatScraper());
      this.register(new BroadwayDirectScraper());
    }
  }

  /**
   * Register a scraper
   */
  static register(scraper: PlatformScraper): void {
    this.scrapers.set(scraper.platform, scraper);
    console.log(`Registered scraper for platform: ${scraper.platform}`);
  }

  /**
   * Get a scraper by platform
   */
  static get(platform: 'socialtoaster' | 'broadwaydirect'): PlatformScraper | undefined {
    this.registerDefaults();
    return this.scrapers.get(platform);
  }

  /**
   * Get all registered scrapers
   */
  static getAll(): PlatformScraper[] {
    this.registerDefaults();
    return Array.from(this.scrapers.values());
  }

  /**
   * Scrape all platforms
   * @param browser - Playwright browser instance
   * @param delayBetweenPlatforms - Delay between scraping different platforms (ms)
   * @returns Promise resolving to array of all shows
   */
  static async scrapeAll(browser: Browser, delayBetweenPlatforms: number = 3000): Promise<Show[]> {
    this.registerDefaults();
    const allShows: Show[] = [];
    const scrapers = Array.from(this.scrapers.values());

    for (let i = 0; i < scrapers.length; i++) {
      const scraper = scrapers[i];
      console.log(`Scraping platform ${i + 1}/${scrapers.length}: ${scraper.platform}`);
      
      const shows = await scraper.scrape(browser);
      allShows.push(...shows);

      // Add delay between platforms if not the last one
      if (i < scrapers.length - 1 && delayBetweenPlatforms > 0) {
        console.log(`Waiting ${delayBetweenPlatforms}ms before next platform...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenPlatforms));
      }
    }

    return allShows;
  }

  /**
   * Clear all registered scrapers (useful for testing)
   */
  static clear(): void {
    this.scrapers.clear();
  }
}
