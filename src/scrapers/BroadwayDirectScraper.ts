import { Browser } from 'playwright';
import { BaseScraper } from './BaseScraper';
import { Show } from '../types';
import { ScraperConfig } from './types';

/**
 * Scraper for BroadwayDirect platform
 */
export class BroadwayDirectScraper extends BaseScraper {
  readonly platform = 'broadwaydirect' as const;
  readonly baseUrl = 'https://lottery.broadwaydirect.com/';

  constructor(config?: ScraperConfig) {
    super(config);
  }

  async scrape(browser: Browser): Promise<Show[]> {
    const shows: Show[] = [];
    
    try {
      const context = await this.createContext(browser);
      const page = await context.newPage();
      
      console.log('Scraping BroadwayDirect...');
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.config.timeout 
      });
      
      // Wait for shows to load
      await this.randomDelay(2000, 4000);
      
      // Extract show information
      const broadwayDirectShows = await this.extractShowsFromPage(page);

      for (const show of broadwayDirectShows) {
        shows.push({
          name: show.name,
          platform: this.platform,
          url: show.url.startsWith('http') ? show.url : `${this.baseUrl}${show.url}`,
          genre: show.genre,
          active: true
        });
      }

      await context.close();
      console.log(`Scraped ${shows.length} shows from BroadwayDirect`);
    } catch (error) {
      console.error('Error scraping BroadwayDirect:', error);
      throw error; // Don't use fallback - let the error propagate
    }
    
    return shows;
  }
}
