import type { VercelRequest, VercelResponse } from '@vercel/node';
import { chromium, Browser } from 'playwright';
import { Show } from '../src/types';

/**
 * Vercel serverless function for scraping Broadway show catalogs
 * This scrapes LuckySeat and BroadwayDirect to get current lottery offerings
 */

// Realistic user agents for scraping
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Random delay to avoid being blocked
 */
async function randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Scrape shows from LuckySeat
 */
async function scrapeLuckySeat(browser: Browser): Promise<Show[]> {
  const shows: Show[] = [];
  
  try {
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: { longitude: -73.935242, latitude: 40.730610 },
      permissions: ['geolocation']
    });

    // Hide automation markers
    await context.addInitScript(() => {
      // @ts-expect-error - navigator is available in browser context
      Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
        get: () => false
      });
    });

    const page = await context.newPage();
    
    console.log('Scraping LuckySeat...');
    await page.goto('https://www.luckyseat.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for shows to load
    await randomDelay(2000, 4000);
    
    // Try to find any visible links or show listings
    // Use multiple selector strategies to find shows
    const luckySeatShows = await page.evaluate(() => {
      const extractedShows: Array<{name: string; url: string; genre?: string}> = [];
      
      // Strategy 1: Look for common show container patterns
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
            let name = text.replace(/\s*lottery\s*/gi, '').trim();
            
            // Skip if it's navigation or footer links
            if (name.length > 0 && name.length < 100 && 
                !name.toLowerCase().includes('about') &&
                !name.toLowerCase().includes('contact') &&
                !name.toLowerCase().includes('terms') &&
                !name.toLowerCase().includes('privacy')) {
              
              seen.add(href);
              extractedShows.push({
                name,
                url: href.startsWith('http') ? href : `https://www.luckyseat.com${href}`,
                genre: 'musical' // Default - could be extracted from page metadata
              });
            }
          }
        }
      });
      
      return extractedShows;
    });

    for (const show of luckySeatShows) {
      shows.push({
        name: show.name,
        platform: 'socialtoaster',
        url: show.url,
        genre: show.genre,
        active: true
      });
    }

    await context.close();
    console.log(`Scraped ${shows.length} shows from LuckySeat`);
  } catch (error) {
    console.error('Error scraping LuckySeat:', error);
    // Fallback to known shows if scraping fails
    const fallbackShows: Show[] = [
      { name: 'Hadestown', platform: 'socialtoaster', url: 'https://www.luckyseat.com/shows/hadestown-newyork', genre: 'musical', active: true },
      { name: 'Moulin Rouge! The Musical', platform: 'socialtoaster', url: 'https://www.luckyseat.com/shows/moulinrouge!themusical-newyork', genre: 'musical', active: true },
      { name: 'The Book of Mormon', platform: 'socialtoaster', url: 'https://www.luckyseat.com/shows/thebookofmormon-newyork', genre: 'musical', active: true },
    ];
    shows.push(...fallbackShows);
    console.log(`Using fallback shows for LuckySeat (${fallbackShows.length} shows)`);
  }
  
  return shows;
}

/**
 * Scrape shows from BroadwayDirect
 */
async function scrapeBroadwayDirect(browser: Browser): Promise<Show[]> {
  const shows: Show[] = [];
  
  try {
    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      geolocation: { longitude: -73.935242, latitude: 40.730610 },
      permissions: ['geolocation']
    });

    // Hide automation markers
    await context.addInitScript(() => {
      // @ts-expect-error - navigator is available in browser context
      Object.defineProperty(Object.getPrototypeOf(navigator), 'webdriver', {
        get: () => false
      });
    });

    const page = await context.newPage();
    
    console.log('Scraping BroadwayDirect...');
    await page.goto('https://lottery.broadwaydirect.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for shows to load
    await randomDelay(2000, 4000);
    
    // Extract show information from the page
    const broadwayDirectShows = await page.evaluate(() => {
      const extractedShows: Array<{name: string; url: string; genre?: string}> = [];
      
      // Strategy: Look for show links
      const containers = document.querySelectorAll(
        'a[href*="/show"], ' +
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
            let name = text.replace(/\s*lottery\s*/gi, '').trim();
            
            // Skip if it's navigation or footer links
            if (name.length > 0 && name.length < 100 && 
                !name.toLowerCase().includes('about') &&
                !name.toLowerCase().includes('contact') &&
                !name.toLowerCase().includes('terms') &&
                !name.toLowerCase().includes('privacy')) {
              
              seen.add(href);
              extractedShows.push({
                name,
                url: href.startsWith('http') ? href : `https://lottery.broadwaydirect.com${href}`,
                genre: 'musical' // Default
              });
            }
          }
        }
      });
      
      return extractedShows;
    });

    for (const show of broadwayDirectShows) {
      shows.push({
        name: show.name,
        platform: 'broadwaydirect',
        url: show.url,
        genre: show.genre,
        active: true
      });
    }

    await context.close();
    console.log(`Scraped ${shows.length} shows from BroadwayDirect`);
  } catch (error) {
    console.error('Error scraping BroadwayDirect:', error);
    // Fallback to known shows if scraping fails
    const fallbackShows: Show[] = [
      { name: 'Aladdin', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/aladdin/', genre: 'musical', active: true },
      { name: 'Wicked', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/wicked/', genre: 'musical', active: true },
      { name: 'The Lion King', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/the-lion-king/', genre: 'musical', active: true },
      { name: 'MJ', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/mj/', genre: 'musical', active: true },
      { name: 'Six', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/six/', genre: 'musical', active: true },
      { name: 'Death Becomes Her', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/death-becomes-her/', genre: 'musical', active: true },
      { name: 'Stranger Things: The First Shadow', platform: 'broadwaydirect', url: 'https://lottery.broadwaydirect.com/show/st-nyc/', genre: 'play', active: true },
    ];
    shows.push(...fallbackShows);
    console.log(`Using fallback shows for BroadwayDirect (${fallbackShows.length} shows)`);
  }
  
  return shows;
}

/**
 * In-memory cache for scraped shows
 * In production, this could be Redis, DynamoDB, or another persistent cache
 */
let cachedShows: Show[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Starting show catalog scraping...');
  console.log('Request method:', req.method);

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if we can use cached data
  const forceRefresh = req.query.refresh === 'true';
  const now = Date.now();
  
  if (!forceRefresh && cachedShows && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    console.log('Returning cached show data');
    return res.status(200).json({
      shows: cachedShows,
      cached: true,
      cacheAge: Math.floor((now - cacheTimestamp) / 1000),
      totalShows: cachedShows.length
    });
  }

  let browser: Browser | null = null;

  try {
    // Launch browser with anti-detection settings
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    const allShows: Show[] = [];

    // Scrape LuckySeat first
    const luckySeatShows = await scrapeLuckySeat(browser);
    allShows.push(...luckySeatShows);

    // Add delay between scraping different platforms to avoid detection
    console.log('Waiting before scraping next platform...');
    await randomDelay(3000, 5000);

    // Scrape BroadwayDirect
    const broadwayDirectShows = await scrapeBroadwayDirect(browser);
    allShows.push(...broadwayDirectShows);

    // Update cache
    cachedShows = allShows;
    cacheTimestamp = now;

    console.log(`Successfully scraped ${allShows.length} total shows`);

    return res.status(200).json({
      shows: allShows,
      cached: false,
      totalShows: allShows.length,
      breakdown: {
        luckyseat: luckySeatShows.length,
        broadwaydirect: broadwayDirectShows.length
      }
    });

  } catch (error) {
    console.error('Error in show scraping:', error);
    
    // Return cached data if available, even if expired
    if (cachedShows && cachedShows.length > 0) {
      console.log('Returning stale cached data due to error');
      return res.status(200).json({
        shows: cachedShows,
        cached: true,
        stale: true,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalShows: cachedShows.length
      });
    }
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      shows: []
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
