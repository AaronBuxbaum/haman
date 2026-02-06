/**
 * Chrome Storage API utilities for the Haman extension
 * Provides persistent storage for user preferences, shows, overrides, and settings
 */

// Storage keys
const KEYS = {
  SETTINGS: 'settings',
  SHOWS: 'shows',
  SHOWS_TIMESTAMP: 'showsTimestamp',
  OVERRIDES: 'overrides',
  CREDENTIALS: 'credentials',
  PREFERENCES: 'preferences',
  PARSED_PREFERENCES: 'parsedPreferences',
  LOTTERY_HISTORY: 'lotteryHistory',
};

// Default settings
const DEFAULT_SETTINGS = {
  autoApplyEnabled: false,
  autoApplyTime: '09:00',
};

/**
 * Get extension settings
 */
async function getSettings() {
  const result = await chrome.storage.sync.get(KEYS.SETTINGS);
  return result[KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

/**
 * Save extension settings
 */
async function saveSettings(settings) {
  await chrome.storage.sync.set({ [KEYS.SETTINGS]: settings });
}

/**
 * Get cached shows
 */
async function getCachedShows() {
  const result = await chrome.storage.local.get([KEYS.SHOWS, KEYS.SHOWS_TIMESTAMP]);
  if (result[KEYS.SHOWS] && result[KEYS.SHOWS_TIMESTAMP]) {
    return {
      shows: result[KEYS.SHOWS],
      timestamp: result[KEYS.SHOWS_TIMESTAMP],
    };
  }
  return null;
}

/**
 * Save shows to cache
 */
async function setCachedShows(shows) {
  await chrome.storage.local.set({
    [KEYS.SHOWS]: shows,
    [KEYS.SHOWS_TIMESTAMP]: Date.now(),
  });
}

/**
 * Get user overrides for shows
 */
async function getOverrides() {
  const result = await chrome.storage.sync.get(KEYS.OVERRIDES);
  return result[KEYS.OVERRIDES] || [];
}

/**
 * Set override for a specific show
 */
async function setOverride(showName, platform, shouldApply) {
  const overrides = await getOverrides();
  const existingIndex = overrides.findIndex(
    (o) => o.showName === showName && o.platform === platform
  );

  const now = new Date().toISOString();
  const override = {
    showName,
    platform,
    shouldApply,
    createdAt: existingIndex >= 0 ? overrides[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    overrides[existingIndex] = override;
  } else {
    overrides.push(override);
  }

  await chrome.storage.sync.set({ [KEYS.OVERRIDES]: overrides });
}

/**
 * Delete override for a specific show
 */
async function deleteOverride(showName, platform) {
  const overrides = await getOverrides();
  const filtered = overrides.filter(
    (o) => !(o.showName === showName && o.platform === platform)
  );
  await chrome.storage.sync.set({ [KEYS.OVERRIDES]: filtered });
}

/**
 * Get user preferences text
 */
async function getPreferences() {
  const result = await chrome.storage.sync.get(KEYS.PREFERENCES);
  return result[KEYS.PREFERENCES] || '';
}

/**
 * Save user preferences text
 */
async function savePreferences(preferences) {
  await chrome.storage.sync.set({ [KEYS.PREFERENCES]: preferences });
}

/**
 * Get parsed preferences
 */
async function getParsedPreferences() {
  const result = await chrome.storage.sync.get(KEYS.PARSED_PREFERENCES);
  return result[KEYS.PARSED_PREFERENCES] || null;
}

/**
 * Save parsed preferences
 */
async function saveParsedPreferences(parsed) {
  await chrome.storage.sync.set({ [KEYS.PARSED_PREFERENCES]: parsed });
}

/**
 * Get platform credentials
 */
async function getCredentials() {
  const result = await chrome.storage.sync.get(KEYS.CREDENTIALS);
  return result[KEYS.CREDENTIALS] || [];
}

/**
 * Save platform credentials
 */
async function saveCredential(credential) {
  const credentials = await getCredentials();
  const id = `${credential.platform}:${credential.email}`;
  const now = new Date().toISOString();

  const existingIndex = credentials.findIndex((c) => c.id === id);
  const newCredential = {
    ...credential,
    id,
    createdAt: existingIndex >= 0 ? credentials[existingIndex].createdAt : now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    credentials[existingIndex] = newCredential;
  } else {
    credentials.push(newCredential);
  }

  await chrome.storage.sync.set({ [KEYS.CREDENTIALS]: credentials });
}

/**
 * Delete platform credential
 */
async function deleteCredentialFromStorage(platform, email) {
  const credentials = await getCredentials();
  const filtered = credentials.filter(
    (c) => !(c.platform === platform && c.email === email)
  );
  await chrome.storage.sync.set({ [KEYS.CREDENTIALS]: filtered });
}

/**
 * Get lottery history
 */
async function getLotteryHistory() {
  const result = await chrome.storage.local.get(KEYS.LOTTERY_HISTORY);
  return result[KEYS.LOTTERY_HISTORY] || [];
}

/**
 * Add lottery result to history
 */
async function addLotteryResult(result) {
  const history = await getLotteryHistory();
  history.unshift(result); // Add to beginning

  // Keep only last 100 results
  const trimmed = history.slice(0, 100);

  await chrome.storage.local.set({ [KEYS.LOTTERY_HISTORY]: trimmed });
}

/**
 * Clear lottery history
 */
async function clearLotteryHistoryStorage() {
  await chrome.storage.local.remove(KEYS.LOTTERY_HISTORY);
}
