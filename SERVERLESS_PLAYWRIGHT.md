# Serverless Playwright Configuration

## Overview

This project uses Playwright for browser automation in a Vercel serverless environment. Running Playwright in serverless functions requires special configuration because:

1. **No browser binaries are pre-installed** in serverless environments
2. **Limited function size** (50MB compressed limit on Vercel)
3. **No system-level package installation** (can't run `apt-get` or `npx playwright install`)

## Solution: @sparticuz/chromium

We use a serverless-optimized approach:

### Dependencies
- **`playwright-core`**: Lightweight Playwright library without browser binaries
- **`@sparticuz/chromium`**: Serverless-optimized Chromium binary designed for AWS Lambda and Vercel

### Why This Approach?

| Package | Size | Includes Browsers | Serverless-Ready |
|---------|------|-------------------|------------------|
| `playwright` | ~300MB | ✅ Yes (Chromium, Firefox, WebKit) | ❌ No |
| `playwright-core` | ~5MB | ❌ No | ⚠️ Requires separate browser |
| `@sparticuz/chromium` | ~50MB compressed | ✅ Chromium only | ✅ Yes |

**Our setup**: `playwright-core` + `@sparticuz/chromium` = Serverless-compatible!

## Implementation Details

### Browser Launch Configuration

```typescript
import { chromium } from 'playwright-core';
import chromiumPackage from '@sparticuz/chromium';

// Get serverless-optimized Chromium executable
const executablePath = await chromiumPackage.executablePath();

// Launch browser with serverless-compatible args
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    ...chromiumPackage.args,  // Serverless-optimized flags
    '--disable-blink-features=AutomationControlled',
    '--no-sandbox',  // Required for serverless
    '--disable-setuid-sandbox'  // Required for serverless
  ]
});
```

### Key Points

1. **executablePath**: Points to the bundled Chromium binary from `@sparticuz/chromium`
2. **chromiumPackage.args**: Pre-configured args for serverless environments
3. **Additional flags**: Anti-detection and performance optimizations

## Files Modified

The following files were updated to support serverless Playwright:

1. **package.json**
   - Replaced `playwright` with `playwright-core`
   - Removed `playwright-chromium`
   - Added `@sparticuz/chromium`

2. **pages/api/scrape-shows.ts**
   - Import from `playwright-core` instead of `playwright`
   - Added `@sparticuz/chromium` import
   - Set `executablePath` before launching browser
   - Merged `chromiumPackage.args` with existing args

3. **src/lotteryAutomation.ts**
   - Same changes as scrape-shows.ts
   - Updated `LotteryAutomation.initialize()` method

4. **All scraper files**
   - Updated imports from `playwright` to `playwright-core`
   - Files: `BaseScraper.ts`, `BroadwayDirectScraper.ts`, `LuckySeatScraper.ts`, `ScraperFactory.ts`, `types.ts`

5. **vercel.json**
   - Added function configuration for memory and timeout
   - Set 1024MB memory for browser automation functions
   - Set 60-second max duration

## Vercel Configuration

```json
{
  "functions": {
    "pages/api/scrape-shows.js": {
      "memory": 1024,
      "maxDuration": 60
    },
    "pages/api/apply-lotteries.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Why These Settings?

- **1024MB memory**: Chromium requires significant memory for browser automation
- **60s max duration**: Allows time for page loads, rendering, and interaction
- **Per-function config**: Only functions that use Playwright need extra resources

## Local Development

The serverless Chromium setup works in both local and production environments:

```bash
npm install          # Installs playwright-core and @sparticuz/chromium
npm run dev          # Works locally without additional browser installation
```

**No need to run** `npx playwright install` anymore!

## Browser Compatibility

| Browser | Support Status |
|---------|----------------|
| Chromium | ✅ Fully supported via @sparticuz/chromium |
| Firefox | ❌ Not available in serverless |
| WebKit | ❌ Not available in serverless |

For serverless deployments, **Chromium is the only supported browser**. This is sufficient for Broadway lottery automation since all target sites work with Chromium.

## Troubleshooting

### Error: "Executable doesn't exist"

This error indicates Playwright is trying to use locally-installed browsers instead of the serverless binary.

**Solution**: Ensure you're importing from `playwright-core` and setting `executablePath`:

```typescript
// ❌ Wrong
import { chromium } from 'playwright';
const browser = await chromium.launch();

// ✅ Correct
import { chromium } from 'playwright-core';
import chromiumPackage from '@sparticuz/chromium';
const executablePath = await chromiumPackage.executablePath();
const browser = await chromium.launch({ executablePath });
```

### Error: "Cannot find module '@sparticuz/chromium'"

**Solution**: Verify the package is in `dependencies`, not `devDependencies`:

```bash
npm install @sparticuz/chromium --save
```

### Function Timeout

If scraping times out (>60 seconds):

1. **Reduce page load timeout**: Lower `timeout` in `page.goto()` options
2. **Optimize selectors**: Use more specific CSS/XPath selectors
3. **Increase max duration**: Update `vercel.json` (up to 300s on paid plans)

### Memory Errors

If you see "Out of memory" errors:

1. **Increase memory**: Update `vercel.json` to 3008MB (maximum on Pro plan)
2. **Close pages**: Ensure `page.close()` is called after each operation
3. **Reuse browser**: Share browser instance across operations

## Performance Considerations

### Cold Starts

First request to a function may take 3-5 seconds as Vercel:
- Initializes the function
- Loads the Chromium binary
- Launches the browser

**Mitigation**: Keep functions warm with periodic requests (e.g., health checks)

### Bundle Size

Our setup keeps the bundle under Vercel's 50MB limit:
- `playwright-core`: ~5MB
- `@sparticuz/chromium`: ~50MB compressed (optimized)
- Total: Within limits ✅

## Security Notes

1. **Browser args**: Flags like `--no-sandbox` are **required** for serverless but reduce security isolation
2. **Use case**: This is acceptable for scraping public lottery sites, but **not recommended** for sensitive operations
3. **CORS bypass**: `--disable-web-security` flag is used to scrape cross-origin resources - documented in code comments

## References

- [@sparticuz/chromium Documentation](https://github.com/Sparticuz/chromium)
- [Playwright Core API](https://playwright.dev/docs/api/class-playwright)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Running Playwright on Vercel](https://www.zenrows.com/blog/playwright-vercel)

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| `playwright-core` | ^1.40.0 | Matches original playwright version |
| `@sparticuz/chromium` | ^143.0.4 | Latest stable release |
| Node.js | 18+ | Required by Vercel |

**Important**: Keep `playwright-core` and `@sparticuz/chromium` versions compatible. Check compatibility at the [@sparticuz/chromium releases page](https://github.com/Sparticuz/chromium/releases).

---

**Last Updated**: 2026-02-06  
**Tested On**: Vercel (Node.js 18+)
