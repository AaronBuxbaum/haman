/**
 * Show catalog management for the Haman extension
 * Provides known Broadway lottery shows for initial data
 */

/**
 * Known Broadway shows with lottery availability
 */
const KNOWN_SHOWS = [
  // BroadwayDirect shows
  {
    name: 'Aladdin',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/aladdin/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Wicked',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/wicked/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'The Lion King',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/the-lion-king/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'MJ The Musical',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/mj/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Six',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/six/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Death Becomes Her',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/death-becomes-her/',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Stranger Things: The First Shadow',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/stranger-things/',
    genre: 'drama',
    active: true,
  },
  {
    name: 'Hamilton',
    platform: 'broadwaydirect',
    url: 'https://lottery.broadwaydirect.com/show/hamilton/',
    genre: 'musical',
    active: true,
  },

  // LuckySeat (SocialToaster) shows
  {
    name: 'Hadestown',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/hadestown-broadway',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Moulin Rouge! The Musical',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/moulin-rouge-the-musical',
    genre: 'musical',
    active: true,
  },
  {
    name: 'The Book of Mormon',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/the-book-of-mormon',
    genre: 'musical',
    active: true,
  },
  {
    name: 'Chicago',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/chicago',
    genre: 'musical',
    active: true,
  },
  {
    name: 'The Phantom of the Opera',
    platform: 'socialtoaster',
    url: 'https://www.luckyseat.com/phantom-of-the-opera',
    genre: 'musical',
    active: true,
  },
];

/**
 * Get all active shows from the known catalog
 */
function getKnownShows() {
  return KNOWN_SHOWS.filter((show) => show.active);
}

/**
 * Get shows by platform
 */
function getShowsByPlatform(platform) {
  return KNOWN_SHOWS.filter((show) => show.active && show.platform === platform);
}

/**
 * Find a show by name
 */
function findShowByName(name) {
  return KNOWN_SHOWS.find(
    (show) => show.name.toLowerCase() === name.toLowerCase() && show.active
  );
}

/**
 * Detect if current page is a lottery page and extract show info
 */
function detectLotteryPage(url) {
  if (url.includes('lottery.broadwaydirect.com')) {
    const match = url.match(/\/show\/([^/]+)/);
    const showName = match ? match[1].replace(/-/g, ' ') : null;
    return { platform: 'broadwaydirect', showName };
  }

  if (url.includes('luckyseat.com')) {
    const match = url.match(/luckyseat\.com\/([^/?]+)/);
    const showName = match ? match[1].replace(/-/g, ' ') : null;
    return { platform: 'socialtoaster', showName };
  }

  return null;
}
