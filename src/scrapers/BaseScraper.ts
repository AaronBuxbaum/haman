import { Browser } from 'playwright';
import { PlatformScraper, ScraperConfig } from './types';
import { Show } from '../types';

/**
 * Default scraper configuration
 */
const DEFAULT_CONFIG: Required<ScraperConfig> = {
  minDelay: 1000,
  maxDelay: 3000,
  timeout: 30000,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ],
  geolocation: {
    latitude: 40.730610,  // NYC coordinates
    longitude: -73.935242,
  },
};

/**
 * Base class for platform scrapers with common functionality
 */
export abstract class BaseScraper implements PlatformScraper {
  abstract readonly platform: 'socialtoaster' | 'broadwaydirect';
  abstract readonly baseUrl: string;

  protected readonly config: Required<ScraperConfig>;

  constructor(config?: ScraperConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Scrape shows from the platform
   */
  abstract scrape(browser: Browser): Promise<Show[]>;

  /**
   * Get a random user agent from the configured list
   */
  protected getRandomUserAgent(): string {
    const agents = this.config.userAgents;
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Random delay to avoid being blocked
   */
  protected async randomDelay(min?: number, max?: number): Promise<void> {
    const minDelay = min ?? this.config.minDelay;
    const maxDelay = max ?? this.config.maxDelay;
    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Create a browser context with anti-detection settings
   */
  protected async createContext(browser: Browser) {
    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: this.config.geolocation,
      permissions: ['geolocation']
    });

    // Hide automation markers
    await context.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.defineProperty(Object.getPrototypeOf((navigator as any)), 'webdriver', {
        get: () => false
      });
    });

    return context;
  }

  /**
   * Extract shows from page using common selectors
   */
  protected async extractShowsFromPage(page: { evaluate: (fn: () => Array<{name: string; url: string; genre?: string}>) => Promise<Array<{name: string; url: string; genre?: string}>> }): Promise<Array<{name: string; url: string; genre?: string}>> {
    return await page.evaluate(() => {
      const extractedShows: Array<{name: string; url: string; genre?: string}> = [];
      
      // Strategy: Look for common show container patterns
      const containers = document.querySelectorAll(
        'a[href*="/show"], ' +
        'a[href*="/lottery"], ' +
        '[class*="show"] a, ' +
        '[class*="lottery"] a, ' +
        '[data-show] a, ' +
        '.card a, ' +
        '.item a'
      );
      
      const seen = new Set<string>();
      
      containers.forEach(el => {
        if (el instanceof HTMLAnchorElement) {
          const href = el.getAttribute('href');
          const text = el.textContent?.trim() || el.getAttribute('title') || el.getAttribute('aria-label');
          
          if (href && text && href.includes('show') && !seen.has(href)) {
            // Clean up the show name
            const name = text.replace(/\s*lottery\s*/gi, '').trim();
            
            // Skip if it's navigation or footer links
            if (name.length > 0 && name.length < 100 && 
                !name.toLowerCase().includes('about') &&
                !name.toLowerCase().includes('contact') &&
                !name.toLowerCase().includes('terms') &&
                !name.toLowerCase().includes('privacy')) {
              
              seen.add(href);
              extractedShows.push({
                name,
                url: href,
                genre: 'musical' // Fallback to 'musical' since most Broadway lotteries are for musicals
              });
            }
          }
        }
      });
      
      return extractedShows;
    });
  }
}
