# Scraper Abstraction Layer

This document describes the scraper abstraction layer that enables easy addition of new lottery platforms.

## Architecture

The scraper system uses an extensible architecture with the following components:

### 1. PlatformScraper Interface (`src/scrapers/types.ts`)

Defines the contract that all platform scrapers must implement:

```typescript
interface PlatformScraper {
  readonly platform: 'socialtoaster' | 'broadwaydirect';
  readonly baseUrl: string;
  scrape(browser: Browser): Promise<Show[]>;
}
```

### 2. BaseScraper Class (`src/scrapers/BaseScraper.ts`)

Abstract base class that provides common functionality:

- **Anti-detection features**: User agent rotation, random delays, browser fingerprinting
- **Browser context creation**: Configured with NYC geolocation, proper locale, timezone
- **Common extraction logic**: Shared selectors and patterns for finding show listings
- **Configuration options**: Customizable timeouts, delays, and user agents

### 3. Platform-Specific Scrapers

#### LuckySeatScraper (`src/scrapers/LuckySeatScraper.ts`)
- Scrapes shows from https://www.luckyseat.com/
- Platform: `socialtoaster`
- Includes fallback shows if scraping fails

#### BroadwayDirectScraper (`src/scrapers/BroadwayDirectScraper.ts`)
- Scrapes shows from https://lottery.broadwaydirect.com/
- Platform: `broadwaydirect`
- Includes fallback shows if scraping fails

### 4. ScraperFactory (`src/scrapers/ScraperFactory.ts`)

Factory pattern for managing scrapers:

- **Auto-registration**: Default scrapers automatically registered on first access
- **Manual registration**: Support for adding custom scrapers
- **Batch scraping**: `scrapeAll()` method scrapes all platforms with configurable delays
- **Platform lookup**: Get scrapers by platform name

## Adding a New Platform

To add support for a new lottery platform:

### Step 1: Create a New Scraper Class

```typescript
// src/scrapers/NewPlatformScraper.ts
import { Browser } from 'playwright';
import { BaseScraper } from './BaseScraper';
import { Show } from '../types';
import { ScraperConfig } from './types';

export class NewPlatformScraper extends BaseScraper {
  readonly platform = 'newplatform' as const;
  readonly baseUrl = 'https://newplatform.com/';

  constructor(config?: ScraperConfig) {
    super(config);
  }

  async scrape(browser: Browser): Promise<Show[]> {
    const shows: Show[] = [];
    
    try {
      const context = await this.createContext(browser);
      const page = await context.newPage();
      
      console.log('Scraping NewPlatform...');
      await page.goto(this.baseUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: this.config.timeout 
      });
      
      await this.randomDelay(2000, 4000);
      
      // Use the base class method or implement custom extraction
      const extractedShows = await this.extractShowsFromPage(page);

      for (const show of extractedShows) {
        shows.push({
          name: show.name,
          platform: this.platform,
          url: show.url.startsWith('http') ? show.url : `${this.baseUrl}${show.url}`,
          genre: show.genre,
          active: true
        });
      }

      await context.close();
      console.log(`Scraped ${shows.length} shows from NewPlatform`);
    } catch (error) {
      console.error('Error scraping NewPlatform:', error);
      // Add fallback shows if needed
    }
    
    return shows;
  }
}
```

### Step 2: Update Types

Add the new platform to the type definitions in `src/types.ts`:

```typescript
export interface Show {
  name: string;
  platform: 'socialtoaster' | 'broadwaydirect' | 'newplatform';
  url: string;
  genre?: string;
  active: boolean;
}
```

### Step 3: Register the Scraper

Add the scraper to the factory in `src/scrapers/ScraperFactory.ts`:

```typescript
import { NewPlatformScraper } from './NewPlatformScraper';

private static registerDefaults() {
  if (this.scrapers.size === 0) {
    this.register(new LuckySeatScraper());
    this.register(new BroadwayDirectScraper());
    this.register(new NewPlatformScraper()); // Add here
  }
}
```

### Step 4: Export from Index

Export the new scraper from `src/scrapers/index.ts`:

```typescript
export { NewPlatformScraper } from './NewPlatformScraper';
```

### Step 5: Update Lottery Automation

Add automation logic for the new platform in `src/lotteryAutomation.ts`.

## Usage

### Basic Usage

```typescript
import { ScraperFactory } from './src/scrapers';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });

// Scrape all platforms
const allShows = await ScraperFactory.scrapeAll(browser);

// Or scrape a specific platform
const luckySeatScraper = ScraperFactory.get('socialtoaster');
const shows = await luckySeatScraper.scrape(browser);

await browser.close();
```

### Custom Configuration

```typescript
import { LuckySeatScraper } from './src/scrapers';

const scraper = new LuckySeatScraper({
  minDelay: 2000,
  maxDelay: 5000,
  timeout: 60000,
  userAgents: ['Custom User Agent String'],
});
```

## Anti-Detection Features

The scraper system implements multiple anti-detection measures:

1. **User Agent Rotation**: Random selection from a pool of realistic user agents
2. **Random Delays**: Human-like delays between requests (configurable)
3. **Geolocation**: Set to NYC coordinates for Broadway lottery sites
4. **Webdriver Detection**: Hides `navigator.webdriver` property
5. **Browser Fingerprinting**: Proper locale, timezone, viewport settings
6. **Request Interspersing**: Configurable delays between different platforms

## API Endpoints

### `/api/scrape-shows` (Vercel Function)
- **Method**: GET
- **Query Parameters**: `?refresh=true` to force refresh
- **Response**: Array of shows with caching metadata
- **Caching**: 1 hour cache duration

### `/api/refresh-shows` (Next.js API Route)
- **Method**: POST
- **Purpose**: Triggers a forced refresh of the show catalog
- **Implementation**: Calls `getBroadwayShows(true)` which uses the scraper API

## Testing

Tests are located in `src/scrapers/scrapers.test.ts` and cover:

- Scraper registration and retrieval
- Factory pattern functionality
- Platform identification
- Base URL configuration

Run tests with:
```bash
bun test src/scrapers/scrapers.test.ts
```

## Best Practices

1. **Fallback Shows**: Always include fallback shows in case scraping fails
2. **Error Handling**: Wrap scraping logic in try-catch blocks
3. **Logging**: Log progress and errors for debugging
4. **Rate Limiting**: Use random delays to avoid being blocked
5. **Caching**: Implement caching to minimize scraping frequency
6. **Testing**: Test against real sites periodically to ensure selectors still work

## Troubleshooting

### Scraping Returns Empty Results
- Check if the site structure has changed
- Verify selectors in `extractShowsFromPage()`
- Check browser console logs for JavaScript errors
- Ensure anti-detection measures are working

### Getting Blocked
- Increase delays between requests
- Add more user agents to rotation
- Check if site uses CAPTCHA or bot protection
- Consider using residential proxies

### Performance Issues
- Adjust timeout values in configuration
- Optimize selector queries
- Use `waitUntil: 'domcontentloaded'` instead of 'networkidle'
- Implement parallel scraping with caution

## Future Enhancements

- [ ] Support for pagination
- [ ] API endpoint detection (alternative to scraping)
- [ ] More sophisticated show metadata extraction
- [ ] Proxy support
- [ ] Parallel platform scraping
- [ ] Show deduplication across platforms
- [ ] Historical show tracking
