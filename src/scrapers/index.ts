/**
 * Broadway show scraper abstraction
 * 
 * This module provides an extensible architecture for scraping show data
 * from multiple lottery platforms. New platforms can be added by:
 * 
 * 1. Creating a new class that extends BaseScraper
 * 2. Implementing the scrape() method with platform-specific logic
 * 3. Registering it with ScraperFactory
 * 
 * Example:
 * ```typescript
 * class NewPlatformScraper extends BaseScraper {
 *   readonly platform = 'newplatform' as const;
 *   readonly baseUrl = 'https://example.com/';
 * 
 *   async scrape(browser: Browser): Promise<Show[]> {
 *     // Implementation
 *   }
 * }
 * 
 * ScraperFactory.register(new NewPlatformScraper());
 * ```
 */

export type { PlatformScraper, ScraperConfig } from './types';
export { BaseScraper } from './BaseScraper';
export { LuckySeatScraper } from './LuckySeatScraper';
export { BroadwayDirectScraper } from './BroadwayDirectScraper';
export { ScraperFactory } from './ScraperFactory';
