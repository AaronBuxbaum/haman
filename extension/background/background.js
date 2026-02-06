/**
 * Background service worker for the Haman Chrome Extension
 * Handles message passing, alarms, and background tasks
 */

// Import shared modules (they'll be bundled/available at runtime)
// Note: In MV3 service workers, we import these inline

// Alarm names
const ALARMS = {
  DAILY_APPLY: 'dailyApply',
  REFRESH_SHOWS: 'refreshShows',
};

// Storage keys (duplicated here for service worker isolation)
const STORAGE_KEYS = {
  SETTINGS: 'settings',
  SHOWS: 'shows',
  SHOWS_TIMESTAMP: 'showsTimestamp',
  OVERRIDES: 'overrides',
  PARSED_PREFERENCES: 'parsedPreferences',
  LOTTERY_HISTORY: 'lotteryHistory',
};

// Shows are dynamically scraped - no hardcoded catalog

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Haman extension installed', details.reason);

  // Initialize shows cache as empty - shows will be scraped dynamically
  const result = await chrome.storage.local.get([STORAGE_KEYS.SHOWS]);
  if (!result[STORAGE_KEYS.SHOWS]) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SHOWS]: [],
      [STORAGE_KEYS.SHOWS_TIMESTAMP]: Date.now(),
    });
  }

  // Set up daily alarm for auto-apply
  await setupAlarms();
});

/**
 * Set up alarms for scheduled tasks
 */
async function setupAlarms() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
  const settings = result[STORAGE_KEYS.SETTINGS] || { autoApplyEnabled: false, autoApplyTime: '09:00' };

  // Clear existing alarms
  await chrome.alarms.clear(ALARMS.DAILY_APPLY);

  if (settings.autoApplyEnabled && settings.autoApplyTime) {
    const [hours, minutes] = settings.autoApplyTime.split(':').map(Number);

    const now = new Date();
    const alarmTime = new Date();
    alarmTime.setHours(hours, minutes, 0, 0);

    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }

    chrome.alarms.create(ALARMS.DAILY_APPLY, {
      when: alarmTime.getTime(),
      periodInMinutes: 24 * 60,
    });

    console.log(`Daily apply alarm set for ${alarmTime.toISOString()}`);
  }
}

/**
 * Handle alarms
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  console.log('Alarm triggered:', alarm.name);

  if (alarm.name === ALARMS.DAILY_APPLY) {
    await handleDailyApply();
  }
});

/**
 * Handle daily auto-apply
 */
async function handleDailyApply() {
  const [settingsResult, prefsResult] = await Promise.all([
    chrome.storage.sync.get(STORAGE_KEYS.SETTINGS),
    chrome.storage.sync.get(STORAGE_KEYS.PARSED_PREFERENCES),
  ]);
  
  const settings = settingsResult[STORAGE_KEYS.SETTINGS] || {};
  const parsedPrefs = prefsResult[STORAGE_KEYS.PARSED_PREFERENCES];
  
  if (!settings.autoApplyEnabled) return;

  // Check if user is available for shows based on their schedule preferences
  if (!shouldEnterLotteriesToday(parsedPrefs)) {
    console.log('Haman: Skipping lottery applications - user not available based on schedule preferences');
    return;
  }

  const shows = await getShowsWithPreferences();
  const enabledShows = shows.filter((s) => s.finalDecision);

  console.log(`Auto-applying to ${enabledShows.length} shows`);

  for (const show of enabledShows) {
    try {
      const tab = await chrome.tabs.create({ url: show.show.url, active: false });

      // Wait for tab to load before sending message
      await new Promise((resolve) => {
        function listener(tabId, changeInfo) {
          if (tabId === tab.id && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);

            chrome.tabs.sendMessage(tab.id, {
              type: 'FILL_LOTTERY_FORM',
              payload: {
                email: settings.defaultEmail,
                firstName: settings.defaultFirstName,
                lastName: settings.defaultLastName,
                dateOfBirth: settings.dateOfBirth,
                zipCode: settings.zipCode,
                country: settings.country || 'US',
                ticketQuantity: settings.ticketQuantity || '2',
                autoSubmit: true, // Enable auto-submit for scheduled applications
              },
            });
            
            resolve();
          }
        }
        chrome.tabs.onUpdated.addListener(listener);
      });
      
      // Small delay between applications to be respectful
      await new Promise(r => setTimeout(r, 5000));
    } catch (error) {
      console.error(`Error applying to ${show.show.name}:`, error);
    }
  }
}

/**
 * Check if a show matches user preferences
 */
function matchesPreferences(show, preferences) {
  if (!preferences) return false;
  
  if (preferences.showNames && preferences.showNames.length > 0) {
    const showMatch = preferences.showNames.some((name) =>
      show.name.toLowerCase().includes(name.toLowerCase())
    );
    if (!showMatch) return false;
  }

  if (preferences.excludeShows && preferences.excludeShows.length > 0) {
    const isExcluded = preferences.excludeShows.some((name) =>
      show.name.toLowerCase().includes(name.toLowerCase())
    );
    if (isExcluded) return false;
  }

  if (preferences.genres && preferences.genres.length > 0 && show.genre) {
    const genreMatch = preferences.genres.some((genre) =>
      show.genre.toLowerCase().includes(genre)
    );
    if (!genreMatch) return false;
  }

  return true;
}

/**
 * Check if user is available on a given date based on their preferences
 * @param {Date} date - The date to check
 * @param {Object} availability - The parsed availability preferences
 * @returns {boolean} - True if user is available
 */
function checkAvailability(date, availability) {
  if (!availability) return true; // No availability restrictions

  // Check day of week availability
  if (availability.daysOfWeek && availability.daysOfWeek.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    
    if (!availability.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check specific dates (if provided)
  if (availability.specificDates && availability.specificDates.length > 0) {
    const dateStr = date.toISOString().split('T')[0];
    if (!availability.specificDates.includes(dateStr)) {
      return false;
    }
  }

  // Check excluded dates
  if (availability.excludeDates && availability.excludeDates.length > 0) {
    const dateStr = date.toISOString().split('T')[0];
    if (availability.excludeDates.includes(dateStr)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if today is a day user should enter lotteries based on availability
 */
function shouldEnterLotteriesToday(preferences) {
  if (!preferences || !preferences.availability) return true;
  
  // For lottery entry, we check if the user would be available for shows
  // that typically happen the next day or the day after (common lottery patterns)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if user is available tomorrow (most lotteries are for next day shows)
  return checkAvailability(tomorrow, preferences.availability);
}

/**
 * Get shows with preference matching and overrides applied
 */
async function getShowsWithPreferences() {
  const [showsResult, overridesResult, prefsResult, settingsResult] = await Promise.all([
    chrome.storage.local.get([STORAGE_KEYS.SHOWS]),
    chrome.storage.sync.get(STORAGE_KEYS.OVERRIDES),
    chrome.storage.sync.get(STORAGE_KEYS.PARSED_PREFERENCES),
    chrome.storage.sync.get(STORAGE_KEYS.SETTINGS),
  ]);

  const shows = showsResult[STORAGE_KEYS.SHOWS] || [];
  const overrides = overridesResult[STORAGE_KEYS.OVERRIDES] || [];
  const parsedPrefs = prefsResult[STORAGE_KEYS.PARSED_PREFERENCES];
  const settings = settingsResult[STORAGE_KEYS.SETTINGS] || {};

  const overrideMap = new Map(
    overrides.map((o) => [`${o.platform}:${o.showName}`, o])
  );

  return shows.map((show) => {
    const overrideKey = `${show.platform}:${show.name}`;
    const override = overrideMap.get(overrideKey);
    const matches = parsedPrefs && settings.openaiApiKey
      ? matchesPreferences(show, parsedPrefs)
      : false;

    return {
      show,
      matchesPreference: matches,
      hasOverride: !!override,
      overrideShouldApply: override?.shouldApply,
      finalDecision: override?.shouldApply ?? matches,
    };
  });
}

/**
 * Parse preferences using OpenAI
 */
async function parsePreferencesWithAI(preferencesText, apiKey) {
  const systemPrompt = `You are a helpful assistant that parses user preferences for Broadway show lotteries.
Extract the following information from the user's text:
- genres: Array of genres they're interested in (musical, drama, comedy, etc.)
- showNames: Specific show names mentioned
- priceRange: Min and max price if mentioned
- dateRange: Date ranges if mentioned
- excludeShows: Shows they want to exclude
- keywords: Other relevant keywords
- availability: Object describing when the user is available to attend shows. Extract:
  - daysOfWeek: Array of days they can attend (e.g., ["Friday", "Saturday", "Sunday"])
  - timePreference: "matinee", "evening", or "any" if mentioned
  - specificDates: Array of specific dates they can attend (in YYYY-MM-DD format)
  - excludeDates: Array of dates they cannot attend (in YYYY-MM-DD format)

For availability, pay attention to phrases like:
- "I'm only available on Friday and Saturday" -> daysOfWeek: ["Friday", "Saturday"]
- "weekends only" -> daysOfWeek: ["Saturday", "Sunday"]
- "no Mondays" -> this means all days except Monday
- "matinee shows only" -> timePreference: "matinee"
- "evening performances" -> timePreference: "evening"

Return ONLY a valid JSON object with these fields. If a field is not mentioned, omit it.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this preference text: "${preferencesText}"` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates async response
});

/**
 * Process incoming messages
 */
async function handleMessage(message, sender) {
  console.log('Received message:', message.type);

  switch (message.type) {
    case 'GET_SHOWS':
      return {
        success: true,
        data: await getShowsWithPreferences(),
      };

    case 'REFRESH_SHOWS':
      // Shows are scraped dynamically - just update timestamp
      await chrome.storage.local.set({
        [STORAGE_KEYS.SHOWS_TIMESTAMP]: Date.now(),
      });
      return {
        success: true,
        data: await getShowsWithPreferences(),
      };

    case 'SET_OVERRIDE': {
      const { showName, platform, shouldApply } = message.payload;
      const overridesResult = await chrome.storage.sync.get(STORAGE_KEYS.OVERRIDES);
      const overrides = overridesResult[STORAGE_KEYS.OVERRIDES] || [];
      
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

      await chrome.storage.sync.set({ [STORAGE_KEYS.OVERRIDES]: overrides });
      return { success: true };
    }

    case 'GET_SETTINGS': {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      return {
        success: true,
        data: result[STORAGE_KEYS.SETTINGS] || { autoApplyEnabled: false, autoApplyTime: '09:00' },
      };
    }

    case 'SAVE_SETTINGS':
      await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: message.payload });
      await setupAlarms();
      return { success: true };

    case 'PARSE_PREFERENCES': {
      const settingsResult = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      const settings = settingsResult[STORAGE_KEYS.SETTINGS] || {};
      
      if (!settings.openaiApiKey) {
        return { success: false, error: 'OpenAI API key not configured' };
      }

      const preferences = message.payload.preferences;
      await chrome.storage.sync.set({ preferences });

      const parsed = await parsePreferencesWithAI(preferences, settings.openaiApiKey);
      await chrome.storage.sync.set({ [STORAGE_KEYS.PARSED_PREFERENCES]: parsed });

      return { success: true, data: parsed };
    }

    case 'APPLY_LOTTERY': {
      const show = message.payload.show;
      const tab = await chrome.tabs.create({ url: show.url, active: true });
      return { success: true, data: { tabId: tab.id } };
    }

    case 'GET_LOTTERY_HISTORY': {
      const historyResult = await chrome.storage.local.get(STORAGE_KEYS.LOTTERY_HISTORY);
      return {
        success: true,
        data: historyResult[STORAGE_KEYS.LOTTERY_HISTORY] || [],
      };
    }

    case 'LOTTERY_RESULT': {
      const historyResult = await chrome.storage.local.get(STORAGE_KEYS.LOTTERY_HISTORY);
      const history = historyResult[STORAGE_KEYS.LOTTERY_HISTORY] || [];
      
      history.unshift({
        ...message.payload,
        timestamp: new Date().toISOString(),
      });

      await chrome.storage.local.set({
        [STORAGE_KEYS.LOTTERY_HISTORY]: history.slice(0, 100),
      });
      return { success: true };
    }

    case 'ADD_DISCOVERED_SHOW': {
      // Add a newly discovered show from scraping lottery pages
      const { show } = message.payload;
      const showsResult = await chrome.storage.local.get([STORAGE_KEYS.SHOWS]);
      const shows = showsResult[STORAGE_KEYS.SHOWS] || [];
      
      // Check if show already exists (by URL)
      const exists = shows.some(s => s.url === show.url);
      if (!exists) {
        shows.push({
          ...show,
          active: true,
          discoveredAt: new Date().toISOString(),
        });
        await chrome.storage.local.set({
          [STORAGE_KEYS.SHOWS]: shows,
          [STORAGE_KEYS.SHOWS_TIMESTAMP]: Date.now(),
        });
        console.log(`Discovered new show: ${show.name}`);
      }
      return { success: true };
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Check if URL is a valid lottery page using hostname validation
 */
function isValidLotteryUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check for BroadwayDirect lottery page
    if (hostname === 'lottery.broadwaydirect.com' || 
        hostname.endsWith('.broadwaydirect.com')) {
      return true;
    }
    
    // Check for LuckySeat lottery page
    if (hostname === 'luckyseat.com' || 
        hostname === 'www.luckyseat.com' ||
        hostname.endsWith('.luckyseat.com')) {
      return true;
    }
  } catch (e) {
    // Invalid URL
    return false;
  }
  
  return false;
}

/**
 * Detect lottery pages when tabs update
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isLotteryPage = isValidLotteryUrl(tab.url);
    
    if (isLotteryPage) {
      chrome.action.setBadgeText({ tabId, text: '🎭' });
      chrome.action.setBadgeBackgroundColor({ tabId, color: '#4CAF50' });
    } else {
      chrome.action.setBadgeText({ tabId, text: '' });
    }
  }
});
