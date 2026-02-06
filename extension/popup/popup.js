/**
 * Popup script for the Haman Chrome Extension
 * Handles UI interactions and communication with background service worker
 */

// DOM Elements
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('content');
const historyViewEl = document.getElementById('historyView');
const showsListEl = document.getElementById('showsList');
const historyListEl = document.getElementById('historyList');
const showCountEl = document.getElementById('showCount');
const preferencesEl = document.getElementById('preferences');
const messageEl = document.getElementById('message');
const noApiKeyWarningEl = document.getElementById('noApiKeyWarning');

// Buttons
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');
const parseBtn = document.getElementById('parseBtn');
const viewHistoryLink = document.getElementById('viewHistoryLink');
const backToShowsBtn = document.getElementById('backToShowsBtn');

// State
let currentShows = [];
let settings = null;

/**
 * Initialize the popup
 */
async function init() {
  try {
    // Load settings first
    const settingsResponse = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    settings = settingsResponse.data || {};

    // Load preferences
    const result = await chrome.storage.sync.get('preferences');
    if (result.preferences) {
      preferencesEl.value = result.preferences;
    }

    // Check if OpenAI API key is configured
    if (!settings.openaiApiKey) {
      noApiKeyWarningEl.classList.remove('hidden');
    }

    // Load shows
    await loadShows();

    // Show content
    loadingEl.classList.add('hidden');
    contentEl.classList.remove('hidden');
  } catch (error) {
    console.error('Error initializing popup:', error);
    showMessage('Error loading data', 'error');
    loadingEl.textContent = 'Error loading. Please try again.';
  }
}

/**
 * Load shows from background
 */
async function loadShows() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SHOWS' });

    if (response.success) {
      currentShows = response.data;
      renderShows(currentShows);
    } else {
      showMessage(response.error || 'Failed to load shows', 'error');
    }
  } catch (error) {
    console.error('Error loading shows:', error);
    showMessage('Failed to load shows', 'error');
  }
}

/**
 * Render shows list
 */
function renderShows(shows) {
  showCountEl.textContent = shows.length.toString();

  if (shows.length === 0) {
    showsListEl.innerHTML = `
      <div class="empty-state">
        <p>No shows discovered yet</p>
        <p class="hint">Visit lottery pages on BroadwayDirect or LuckySeat to discover shows automatically.</p>
      </div>
    `;
    return;
  }

  showsListEl.innerHTML = shows.map((item) => {
    const { show, finalDecision, hasOverride, matchesPreference } = item;

    let statusText = '';
    if (hasOverride) {
      statusText = finalDecision ? 'Manually Enabled' : 'Manually Disabled';
    } else if (!settings?.openaiApiKey) {
      statusText = 'Configure API key to enable';
    } else if (matchesPreference) {
      statusText = 'Matches Preferences';
    } else {
      statusText = 'Does Not Match';
    }

    return `
      <div class="show-card" data-show="${encodeURIComponent(JSON.stringify(show))}">
        <div class="show-info">
          <div class="show-name" title="${show.name}">${show.name}</div>
          <div class="show-meta">
            <span class="show-platform">${show.platform}</span>
            ${show.genre ? `<span class="show-genre">${show.genre}</span>` : ''}
          </div>
          <div class="show-status">${statusText}</div>
        </div>
        <div class="show-actions">
          <button
            class="toggle-btn ${finalDecision ? 'enabled' : 'disabled'}"
            data-show-name="${show.name}"
            data-platform="${show.platform}"
            data-current="${finalDecision}"
            title="${finalDecision ? 'Click to disable' : 'Click to enable'}"
          >
            ${finalDecision ? '✓' : '✗'}
          </button>
          <button
            class="apply-btn"
            data-url="${show.url}"
            title="Open lottery page"
          >
            🎯
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  showsListEl.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', handleToggle);
  });

  showsListEl.querySelectorAll('.apply-btn').forEach((btn) => {
    btn.addEventListener('click', handleApply);
  });
}

/**
 * Handle toggle button click
 */
async function handleToggle(event) {
  const btn = event.currentTarget;
  const showName = btn.dataset.showName;
  const platform = btn.dataset.platform;
  const currentValue = btn.dataset.current === 'true';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SET_OVERRIDE',
      payload: {
        showName,
        platform,
        shouldApply: !currentValue,
      },
    });

    if (response.success) {
      await loadShows();
      showMessage(`${showName} ${!currentValue ? 'enabled' : 'disabled'}`, 'success');
    } else {
      showMessage('Failed to update', 'error');
    }
  } catch (error) {
    console.error('Error toggling show:', error);
    showMessage('Failed to update', 'error');
  }
}

/**
 * Handle apply button click
 */
async function handleApply(event) {
  const url = event.currentTarget.dataset.url;

  try {
    await chrome.tabs.create({ url, active: true });
  } catch (error) {
    console.error('Error opening lottery page:', error);
    showMessage('Failed to open page', 'error');
  }
}

/**
 * Handle refresh button click
 */
async function handleRefresh() {
  refreshBtn.disabled = true;
  showMessage('Refreshing shows...', 'info');

  try {
    const response = await chrome.runtime.sendMessage({ type: 'REFRESH_SHOWS' });

    if (response.success) {
      currentShows = response.data;
      renderShows(currentShows);
      showMessage('Shows refreshed', 'success');
    } else {
      showMessage(response.error || 'Failed to refresh', 'error');
    }
  } catch (error) {
    console.error('Error refreshing shows:', error);
    showMessage('Failed to refresh', 'error');
  } finally {
    refreshBtn.disabled = false;
  }
}

/**
 * Handle parse preferences button click
 */
async function handleParsePreferences() {
  const preferences = preferencesEl.value.trim();

  if (!preferences) {
    showMessage('Please enter your preferences', 'error');
    return;
  }

  if (!settings?.openaiApiKey) {
    showMessage('Please add your OpenAI API key in Settings', 'error');
    return;
  }

  parseBtn.disabled = true;
  showMessage('Parsing preferences with AI...', 'info');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'PARSE_PREFERENCES',
      payload: { preferences },
    });

    if (response.success) {
      showMessage('Preferences parsed successfully!', 'success');
      await loadShows();
    } else {
      showMessage(response.error || 'Failed to parse preferences', 'error');
    }
  } catch (error) {
    console.error('Error parsing preferences:', error);
    showMessage('Failed to parse preferences', 'error');
  } finally {
    parseBtn.disabled = false;
  }
}

/**
 * Load and show history
 */
async function showHistory() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_LOTTERY_HISTORY' });

    if (response.success) {
      const history = response.data || [];

      if (history.length === 0) {
        historyListEl.innerHTML = '<div class="empty-state">No lottery history yet</div>';
      } else {
        historyListEl.innerHTML = history.map((item) => {
          const date = new Date(item.timestamp).toLocaleString();
          return `
            <div class="history-item ${item.success ? 'success' : 'failed'}">
              <div class="history-show">${item.showName}</div>
              <div class="history-meta">
                <span>${item.platform}</span>
                <span>${date}</span>
              </div>
              ${item.error ? `<div class="history-error">${item.error}</div>` : ''}
            </div>
          `;
        }).join('');
      }

      contentEl.classList.add('hidden');
      historyViewEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading history:', error);
    showMessage('Failed to load history', 'error');
  }
}

/**
 * Show a message to the user
 */
function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove('hidden');

  if (type !== 'error') {
    setTimeout(() => {
      messageEl.classList.add('hidden');
    }, 3000);
  }
}

// Event Listeners
refreshBtn.addEventListener('click', handleRefresh);

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

parseBtn.addEventListener('click', handleParsePreferences);

viewHistoryLink.addEventListener('click', (e) => {
  e.preventDefault();
  showHistory();
});

backToShowsBtn.addEventListener('click', () => {
  historyViewEl.classList.add('hidden');
  contentEl.classList.remove('hidden');
});

// Save preferences when typing stops
let preferencesTimeout;
preferencesEl.addEventListener('input', () => {
  clearTimeout(preferencesTimeout);
  preferencesTimeout = setTimeout(() => {
    chrome.storage.sync.set({ preferences: preferencesEl.value });
  }, 500);
});

// Initialize
init();
