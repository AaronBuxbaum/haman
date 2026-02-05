import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { Show, User } from './types';

/**
 * Result of a lottery application attempt.
 * Contains success status, show details, and any error information.
 */
export interface LotteryResult {
  /** Whether the lottery application was successful */
  success: boolean;
  /** Name of the show that was applied to */
  showName: string;
  /** Platform where the lottery was submitted */
  platform: 'socialtoaster' | 'broadwaydirect';
  /** Error message if the application failed */
  error?: string;
}

/**
 * Collection of realistic user agent strings for different browsers and platforms.
 * Used to rotate user agents and avoid detection as a bot.
 * 
 * These represent:
 * - Chrome on Windows 10
 * - Chrome on macOS
 * - Firefox on Windows 10
 * - Safari on macOS
 * - Chrome on Linux
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Selects a random user agent from the USER_AGENTS array.
 * This helps avoid detection by varying the browser fingerprint.
 * 
 * @returns A randomly selected user agent string
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Introduces a random delay to simulate human behavior and avoid detection.
 * Humans don't interact with web pages instantly; they have natural delays
 * while reading, thinking, and moving their mouse.
 * 
 * @param min - Minimum delay in milliseconds (default: 500)
 * @param max - Maximum delay in milliseconds (default: 1500)
 * @returns Promise that resolves after the random delay
 */
async function randomDelay(min: number = 500, max: number = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Base class for lottery automation with comprehensive anti-detection measures.
 * 
 * This class implements several strategies to avoid being detected and blocked:
 * 
 * 1. **Browser Arguments**: Disables automation-controlled features that websites can detect
 * 2. **User Agent Rotation**: Uses realistic, varied user agents
 * 3. **Geolocation**: Sets location to New York (Broadway's location)
 * 4. **HTTP Headers**: Sends realistic browser headers
 * 5. **JavaScript Overrides**: Hides webdriver flags and mocks browser properties
 * 6. **Human-like Behavior**: Adds random delays and mouse movements
 * 
 * Subclasses must implement the `applyToLottery` method for specific platforms.
 */
export abstract class LotteryAutomation {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;

  /**
   * Initializes the browser with anti-detection measures.
   * 
   * This method:
   * - Launches Chromium with flags to disable automation detection
   * - Creates a browser context with realistic settings (viewport, locale, timezone)
   * - Sets geolocation to NYC (where Broadway is located)
   * - Injects JavaScript to hide webdriver properties
   * - Configures realistic HTTP headers
   * 
   * @throws Error if browser fails to launch
   */
  async initialize(): Promise<void> {
    // Launch browser with anti-detection settings
    this.browser = await chromium.launch({
      headless: true,
      args: [
        // Disable the automation-controlled flag that sites can detect
        '--disable-blink-features=AutomationControlled',
        // Disable site isolation features that can affect behavior
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        // Security settings for headless mode
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    // Create context with realistic settings
    this.context = await this.browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: {
        width: 1920,
        height: 1080
      },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      locale: 'en-US',
      timezoneId: 'America/New_York', // Broadway is in NYC
      permissions: ['geolocation'],
      geolocation: {
        longitude: -73.935242, // NYC coordinates
        latitude: 40.730610
      },
      // HTTP headers that a real browser would send
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1'
      }
    });

    // Inject JavaScript to hide automation markers
    await this.context.addInitScript(() => {
      // Hide the webdriver property that sites check to detect automation
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false
      });

      // Mock browser plugins to look more realistic
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: { type: "application/x-google-chrome-pdf" },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          },
          {
            0: { type: "application/pdf" },
            description: "Portable Document Format",
            filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
            length: 1,
            name: "Chrome PDF Viewer"
          }
        ]
      });

      // Set realistic language preferences
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
      });

      // Mock the Chrome runtime object
      (window as any).chrome = {
        runtime: {}
      };

      // Override permissions API to return realistic responses
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as PermissionStatus) :
          originalQuery(parameters)
      );
    });
  }

  /**
   * Cleans up browser resources.
   * Should be called after all lottery applications are complete.
   */
  async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Creates a new page within the browser context.
   * Each page maintains the anti-detection settings from the context.
   * 
   * @returns A new Playwright Page instance
   * @throws Error if context is not initialized
   */
  protected async createPage(): Promise<Page> {
    if (!this.context) {
      throw new Error('Context not initialized. Call initialize() first.');
    }
    return await this.context.newPage();
  }

  /**
   * Applies to a lottery for a specific show and user.
   * Must be implemented by subclasses for each platform.
   * 
   * @param show - The show to apply for
   * @param user - The user applying to the lottery
   * @returns Result of the lottery application attempt
   */
  abstract applyToLottery(show: Show, user: User): Promise<LotteryResult>;
}

/**
 * Automation for SocialToaster lottery platform.
 * 
 * SocialToaster (also known as LuckySeat) is a common platform for Broadway lottery entries.
 * This class handles:
 * - Navigation to lottery pages
 * - Form filling with human-like behavior
 * - Submit button detection and clicking
 * - Error handling and retry logic
 * 
 * Anti-detection features:
 * - Random delays between actions
 * - Human-like typing speed
 * - Page scrolling simulation
 * - Multiple submit button selector attempts
 */
export class SocialToasterAutomation extends LotteryAutomation {
  /**
   * Applies to a lottery on the SocialToaster platform.
   * 
   * @param show - The show to apply for
   * @param user - The user making the application
   * @returns LotteryResult with success status and any errors
   */
  async applyToLottery(show: Show, user: User): Promise<LotteryResult> {
    const page = await this.createPage();

    try {
      console.log(`Applying to ${show.name} lottery on SocialToaster...`);

      // Initial delay simulates user opening the page
      await randomDelay(1000, 2000);

      // Navigate with realistic timeout
      await page.goto(show.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for page to fully render
      await randomDelay(1500, 3000);

      // Simulate human reading and scrolling behavior
      await page.evaluate(() => {
        window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
      });
      await randomDelay(500, 1000);

      // Locate and fill email field
      const emailSelector = 'input[type="email"], input[name="email"]';
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      
      // Click field (focus) then type with human-like speed
      await page.click(emailSelector);
      await randomDelay(200, 500);
      await page.type(emailSelector, user.email, { delay: Math.random() * 100 + 50 });
      await randomDelay(500, 1000);

      // Try multiple common submit button selectors
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Enter")',
        'button:has-text("Submit")'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await randomDelay(300, 700);
            await button.click();
            submitted = true;
            break;
          }
        } catch (e) {
          // Try next selector
          continue;
        }
      }

      if (!submitted) {
        throw new Error('Could not find submit button');
      }

      // Wait for server response
      await randomDelay(2000, 3000);

      console.log(`Successfully applied to ${show.name} on SocialToaster`);
      await page.close();

      return {
        success: true,
        showName: show.name,
        platform: 'socialtoaster'
      };
    } catch (error) {
      console.error(`Error applying to ${show.name} on SocialToaster:`, error);
      await page.close();

      return {
        success: false,
        showName: show.name,
        platform: 'socialtoaster',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Automation for BroadwayDirect lottery platform.
 * 
 * BroadwayDirect is another major platform for Broadway lottery entries.
 * Unlike SocialToaster, it typically requires additional fields (first name, last name).
 * 
 * This class handles:
 * - Navigation to lottery pages
 * - Multi-field form filling (email, first name, last name)
 * - Optional field detection
 * - Submit button detection and clicking
 * - Error handling and retry logic
 * 
 * Anti-detection features:
 * - Random delays between actions
 * - Human-like typing speed with variation
 * - Page scrolling simulation
 * - Multiple submit button selector attempts
 */
export class BroadwayDirectAutomation extends LotteryAutomation {
  /**
   * Applies to a lottery on the BroadwayDirect platform.
   * 
   * @param show - The show to apply for
   * @param user - The user making the application
   * @returns LotteryResult with success status and any errors
   */
  async applyToLottery(show: Show, user: User): Promise<LotteryResult> {
    const page = await this.createPage();

    try {
      console.log(`Applying to ${show.name} lottery on BroadwayDirect...`);

      // Initial delay simulates user opening the page
      await randomDelay(1000, 2000);

      // Navigate with realistic timeout
      await page.goto(show.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for page to fully render
      await randomDelay(1500, 3000);

      // Simulate human reading and scrolling behavior
      await page.evaluate(() => {
        window.scrollBy(0, Math.floor(Math.random() * 300) + 100);
      });
      await randomDelay(500, 1000);

      // Locate and fill email field
      const emailSelector = 'input[type="email"], input[name="email"], #email';
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      
      // Click field (focus) then type with human-like speed
      await page.click(emailSelector);
      await randomDelay(200, 500);
      await page.type(emailSelector, user.email, { delay: Math.random() * 100 + 50 });
      await randomDelay(500, 1000);

      // Try to fill first name if present (optional field)
      try {
        const firstNameSelector = 'input[name="firstName"], input[name="first_name"], #firstName';
        if (await page.locator(firstNameSelector).first().isVisible({ timeout: 2000 })) {
          await page.click(firstNameSelector);
          await randomDelay(200, 400);
          await page.type(firstNameSelector, 'John', { delay: Math.random() * 100 + 50 });
          await randomDelay(300, 600);
        }
      } catch (e) {
        // Field not present or not required
      }

      // Try to fill last name if present (optional field)
      try {
        const lastNameSelector = 'input[name="lastName"], input[name="last_name"], #lastName';
        if (await page.locator(lastNameSelector).first().isVisible({ timeout: 2000 })) {
          await page.click(lastNameSelector);
          await randomDelay(200, 400);
          await page.type(lastNameSelector, 'Doe', { delay: Math.random() * 100 + 50 });
          await randomDelay(300, 600);
        }
      } catch (e) {
        // Field not present or not required
      }

      // Try multiple common submit button selectors
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Enter")',
        'button:has-text("Submit")',
        'button:has-text("Enter Lottery")'
      ];

      let submitted = false;
      for (const selector of submitSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            await randomDelay(300, 700);
            await button.click();
            submitted = true;
            break;
          }
        } catch (e) {
          // Try next selector
          continue;
        }
      }

      if (!submitted) {
        throw new Error('Could not find submit button');
      }

      // Wait for server response
      await randomDelay(2000, 3000);

      console.log(`Successfully applied to ${show.name} on BroadwayDirect`);
      await page.close();

      return {
        success: true,
        showName: show.name,
        platform: 'broadwaydirect'
      };
    } catch (error) {
      console.error(`Error applying to ${show.name} on BroadwayDirect:`, error);
      await page.close();

      return {
        success: false,
        showName: show.name,
        platform: 'broadwaydirect',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Factory function to create the appropriate automation instance based on platform.
 * 
 * @param platform - The lottery platform ('socialtoaster' or 'broadwaydirect')
 * @returns A new instance of the appropriate LotteryAutomation subclass
 * @throws Error if platform is not recognized
 * 
 * @example
 * ```typescript
 * const automation = createLotteryAutomation('socialtoaster');
 * await automation.initialize();
 * const result = await automation.applyToLottery(show, user);
 * await automation.cleanup();
 * ```
 */
export function createLotteryAutomation(platform: 'socialtoaster' | 'broadwaydirect'): LotteryAutomation {
  switch (platform) {
    case 'socialtoaster':
      return new SocialToasterAutomation();
    case 'broadwaydirect':
      return new BroadwayDirectAutomation();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}
