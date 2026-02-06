/**
 * Show catalog management for the Haman extension
 * Shows are dynamically scraped from lottery sites - no hardcoded shows
 */

/**
 * Detect if current page is a lottery page and extract show info
 * Uses hostname validation to prevent URL manipulation
 */
function detectLotteryPage(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const pathname = urlObj.pathname;

    // Check for BroadwayDirect lottery page
    if (hostname === 'lottery.broadwaydirect.com' || 
        hostname.endsWith('.broadwaydirect.com')) {
      const match = pathname.match(/\/show\/([^/]+)/);
      const showName = match ? match[1].replace(/-/g, ' ') : null;
      return { platform: 'broadwaydirect', showName };
    }

    // Check for LuckySeat lottery page
    if (hostname === 'luckyseat.com' || 
        hostname === 'www.luckyseat.com' ||
        hostname.endsWith('.luckyseat.com')) {
      const match = pathname.match(/^\/([^/?]+)/);
      const showName = match ? match[1].replace(/-/g, ' ') : null;
      return { platform: 'socialtoaster', showName };
    }
  } catch (e) {
    // Invalid URL
    return null;
  }

  return null;
}
