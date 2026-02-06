import { Browser } from 'playwright';
import { BaseScraper } from './BaseScraper';
import { Show } from '../types';
import { ScraperConfig } from './types';

/**
 * Scraper for LuckySeat (SocialToaster platform)
 */
export class LuckySeatScraper extends BaseScraper {
  readonly platform = 'socialtoaster' as const;
  readonly baseUrl = 'https://www.luckyseat.com/';

  constructor(config?: ScraperConfig) {
    super(config);
  }

  async scrape(browser: Browser): Promise<Show[]> {
    const shows: Show[] = [];
    
    try {
      const context = await this.createContext(browser);
      const page = await context.newPage();
      
      console.log('Scraping LuckySeat...');
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.config.timeout 
      });
      
      // Wait for shows to load
      await this.randomDelay(2000, 4000);
      
      // Extract show information
      const luckySeatShows = await this.extractShowsFromPage(page);

      for (const show of luckySeatShows) {
        shows.push({
          name: show.name,
          platform: this.platform,
          url: show.url.startsWith('http') ? show.url : `${this.baseUrl}${show.url}`,
          genre: show.genre,
          active: true
        });
      }

      await context.close();
      console.log(`Scraped ${shows.length} shows from LuckySeat`);
    } catch (error) {
      console.error('Error scraping LuckySeat:', error);
      throw error; // Don't use fallback - let the error propagate
    }
    
    return shows;
  }
}
