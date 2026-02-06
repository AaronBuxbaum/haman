import { Browser } from 'playwright';
import { Show } from '../types';

/**
 * Base interface for platform scrapers
 * Each scraper is responsible for fetching shows from a specific platform
 */
export interface PlatformScraper {
  /**
   * The platform identifier
   */
  readonly platform: 'socialtoaster' | 'broadwaydirect';

  /**
   * The base URL for the platform
   */
  readonly baseUrl: string;

  /**
   * Scrape shows from the platform
   * @param browser - Playwright browser instance
   * @returns Promise resolving to array of shows
   */
  scrape(browser: Browser): Promise<Show[]>;
}

/**
 * Configuration for scraping behavior
 */
export interface ScraperConfig {
  /**
   * Minimum delay between requests (ms)
   */
  minDelay?: number;

  /**
   * Maximum delay between requests (ms)
   */
  maxDelay?: number;

  /**
   * Timeout for page loads (ms)
   */
  timeout?: number;

  /**
   * User agents to rotate through
   */
  userAgents?: string[];

  /**
   * NYC geolocation for lottery sites
   */
  geolocation?: {
    latitude: number;
    longitude: number;
  };
}
