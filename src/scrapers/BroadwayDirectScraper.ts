import { Browser } from 'playwright-core';
import { BaseScraper } from './BaseScraper';
import { Show } from '../types';
import { ScraperConfig } from './types';

/**
 * Scraper for BroadwayDirect platform
 * 
 * This scraper attempts to use the Broadway Direct API directly when available,
 * falling back to page scraping if needed.
 */
export class BroadwayDirectScraper extends BaseScraper {
  readonly platform = 'broadwaydirect' as const;
  readonly baseUrl = 'https://lottery.broadwaydirect.com/';

  constructor(config?: ScraperConfig) {
    super(config);
  }

  /**
   * Try to fetch shows from Broadway Direct API
   * The API may be at /api/shows or similar endpoints
   */
  private async fetchFromAPI(page: { evaluate: <T>(fn: () => Promise<T>) => Promise<T> }): Promise<Show[]> {
    try {
      // Try to intercept API calls or fetch from known endpoints
      const apiData = await page.evaluate(async () => {
        // Try common API endpoints
        const endpoints = [
          '/api/shows',
          '/api/v1/shows',
          '/shows.json',
        ];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              return data;
            }
          } catch {
            // Continue to next endpoint
          }
        }
        
        // If API not available, try to extract from window object
        // Many SPA applications expose data in window variables
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (win.__INITIAL_STATE__ || win.__NEXT_DATA__ || win.shows || win.SHOWS) {
          return win.__INITIAL_STATE__ || win.__NEXT_DATA__ || win.shows || win.SHOWS;
        }
        
        return null;
      });

      if (apiData && typeof apiData === 'object') {
        // Try to extract shows from API data
        const shows = this.extractShowsFromAPIData(apiData);
        if (shows.length > 0) {
          console.log(`Fetched ${shows.length} shows from Broadway Direct API`);
          return shows;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch from API, will try scraping:', error);
    }
    
    return [];
  }

  /**
   * Extract shows from API response data
   */
  private extractShowsFromAPIData(data: unknown): Show[] {
    const shows: Show[] = [];
    
    try {
      // Handle different API response formats
      let showsArray: unknown[] = [];
      
      if (Array.isArray(data)) {
        showsArray = data;
      } else if (typeof data === 'object' && data !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = data as any;
        if (obj.shows && Array.isArray(obj.shows)) {
          showsArray = obj.shows;
        } else if (obj.data && Array.isArray(obj.data)) {
          showsArray = obj.data;
        } else if (obj.results && Array.isArray(obj.results)) {
          showsArray = obj.results;
        }
      }

      for (const item of showsArray) {
        if (typeof item === 'object' && item !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const show = item as any;
          const name = show.name || show.title || show.show_name;
          const url = show.url || show.link || show.href || show.slug;
          
          if (name && url) {
            shows.push({
              name: String(name),
              platform: this.platform,
              url: url.startsWith('http') ? url : `${this.baseUrl}show/${url}`,
              genre: show.genre || show.type || 'musical',
              active: show.active !== false
            });
          }
        }
      }
    } catch (error) {
      console.error('Error extracting shows from API data:', error);
    }
    
    return shows;
  }

  async scrape(browser: Browser): Promise<Show[]> {
    let shows: Show[] = [];
    
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
      
      // First, try to fetch from API
      shows = await this.fetchFromAPI(page);
      
      // If API didn't work, fall back to page scraping
      if (shows.length === 0) {
        console.log('API fetch returned no results, trying page scraping...');
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
      }

      await context.close();
      console.log(`Scraped ${shows.length} shows from BroadwayDirect`);
    } catch (error) {
      console.error('Error scraping BroadwayDirect:', error);
      throw error; // Don't use fallback - let the error propagate
    }
    
    if (shows.length === 0) {
      throw new Error('No shows found on BroadwayDirect - scraping may have failed');
    }
    
    return shows;
  }
}
