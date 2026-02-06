import { Browser } from 'playwright-core';
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
   * This method tries to find all show links on the page, including paginated results
   */
  protected async extractShowsFromPage(page: { 
    evaluate: <T>(fn: () => T) => Promise<T>; 
    click?: (selector: string) => Promise<void>; 
    waitForTimeout?: (ms: number) => Promise<void> 
  }): Promise<Array<{name: string; url: string; genre?: string}>> {
    const allShows: Array<{name: string; url: string; genre?: string}> = [];
    
    // Extract shows from current page
    const extractFromCurrentPage = async () => {
      return await page.evaluate(() => {
        const extractedShows: Array<{name: string; url: string; genre?: string}> = [];
        
        // Strategy: Look for common show container patterns
        // Expanded selectors to catch more shows
        const containers = document.querySelectorAll(
          'a[href*="/show"],' +
          'a[href*="/lottery"],' +
          'a[href*="/shows/"],' +
          '[class*="show"] a,' +
          '[class*="Show"] a,' +
          '[class*="lottery"] a,' +
          '[class*="Lottery"] a,' +
          '[data-show] a,' +
          '[data-testid*="show"] a,' +
          '.card a,' +
          '.item a,' +
          '.show-card a,' +
          '.production a,' +
          '[role="link"][href*="show"]'
        );
        
        const seen = new Set<string>();
        
        containers.forEach(el => {
          if (el instanceof HTMLAnchorElement) {
            const href = el.getAttribute('href');
            const text = el.textContent?.trim() || el.getAttribute('title') || el.getAttribute('aria-label');
            
            if (href && text && href.includes('show') && !seen.has(href)) {
              // Clean up the show name
              let name = text.replace(/\s*lottery\s*/gi, '').trim();
              name = name.replace(/\s*-\s*Broadway\s*/gi, '').trim();
              name = name.replace(/\s*Enter\s*$/gi, '').trim();
              
              // Skip if it's navigation or footer links
              if (name.length > 0 && name.length < 100 && 
                  !name.toLowerCase().includes('about') &&
                  !name.toLowerCase().includes('contact') &&
                  !name.toLowerCase().includes('terms') &&
                  !name.toLowerCase().includes('privacy') &&
                  !name.toLowerCase().includes('view all') &&
                  !name.toLowerCase().includes('see all') &&
                  !name.toLowerCase().includes('more shows')) {
                
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
    };
    
    // Get shows from first page
    const firstPageShows = await extractFromCurrentPage();
    allShows.push(...firstPageShows);
    
    console.log(`Extracted ${firstPageShows.length} shows from current page`);
    
    // Try to detect and handle pagination
    // Look for "Load More", "Next", or similar buttons
    if (page.click && page.waitForTimeout) {
      const paginationAttempts = 5; // Max pagination attempts
      for (let i = 0; i < paginationAttempts; i++) {
        try {
          const hasMore = await page.evaluate<boolean>(() => {
            // Look for pagination/load more buttons
            // Note: We check text content since :contains is not a standard CSS selector
            const buttons = Array.from(document.querySelectorAll('button, a'));
            const loadMoreButton = buttons.find(btn => {
              const text = btn.textContent?.toLowerCase() || '';
              return text.includes('load more') || 
                     text.includes('show more') || 
                     text.includes('next') ||
                     text.includes('see all');
            });
            
            return !!loadMoreButton;
          });
          
          if (!hasMore) {
            console.log('No more pagination detected');
            break;
          }
          
          // Try to click pagination button
          console.log(`Attempting pagination ${i + 1}/${paginationAttempts}`);
          
          // This is a simplified approach - in practice, this might not work
          // due to dynamic button selectors. The scraper will get what it can.
          await page.waitForTimeout(1000);
          
          const newShows = await extractFromCurrentPage();
          if (newShows.length === 0) {
            break; // No new shows loaded
          }
          
          allShows.push(...newShows);
          console.log(`Loaded ${newShows.length} more shows (total: ${allShows.length})`);
          
        } catch (error) {
          console.log('Pagination ended or failed:', error);
          break;
        }
      }
    }
    
    // Remove duplicates based on URL
    const uniqueShows = Array.from(
      new Map(allShows.map(show => [show.url, show])).values()
    );
    
    console.log(`Total unique shows extracted: ${uniqueShows.length}`);
    return uniqueShows;
  }
}
