/**
 * Options page script for the Haman Chrome Extension
 * Handles settings configuration and credential management
 */

// DOM Elements
const settingsForm = document.getElementById('settingsForm');
const messageEl = document.getElementById('message');
const credentialsListEl = document.getElementById('credentialsList');
const addCredentialForm = document.getElementById('addCredentialForm');
const addCredentialBtn = document.getElementById('addCredentialBtn');
const saveCredentialBtn = document.getElementById('saveCredentialBtn');
const cancelCredentialBtn = document.getElementById('cancelCredentialBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const exportDataBtn = document.getElementById('exportDataBtn');

// Form inputs
const openaiApiKeyInput = document.getElementById('openaiApiKey');
const defaultEmailInput = document.getElementById('defaultEmail');
const defaultFirstNameInput = document.getElementById('defaultFirstName');
const defaultLastNameInput = document.getElementById('defaultLastName');
const autoApplyEnabledInput = document.getElementById('autoApplyEnabled');
const autoApplyTimeInput = document.getElementById('autoApplyTime');

// New credential inputs
const newPlatformInput = document.getElementById('newPlatform');
const newEmailInput = document.getElementById('newEmail');
const newPasswordInput = document.getElementById('newPassword');

/**
 * Initialize the options page
 */
async function init() {
  await loadSettings();
  await loadCredentials();
}

/**
 * Load current settings
 */
async function loadSettings() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    const settings = response.data || {};

    openaiApiKeyInput.value = settings.openaiApiKey || '';
    defaultEmailInput.value = settings.defaultEmail || '';
    defaultFirstNameInput.value = settings.defaultFirstName || '';
    defaultLastNameInput.value = settings.defaultLastName || '';
    autoApplyEnabledInput.checked = settings.autoApplyEnabled || false;
    autoApplyTimeInput.value = settings.autoApplyTime || '09:00';
  } catch (error) {
    console.error('Error loading settings:', error);
    showMessage('Failed to load settings', 'error');
  }
}

/**
 * Load credentials
 */
async function loadCredentials() {
  try {
    const result = await chrome.storage.sync.get('credentials');
    const credentials = result.credentials || [];

    if (credentials.length === 0) {
      credentialsListEl.innerHTML = '<p class="help-text">No credentials saved yet</p>';
    } else {
      credentialsListEl.innerHTML = credentials.map((cred) => `
        <div class="credential-item">
          <div class="credential-info">
            <span class="credential-email">${cred.email}</span>
            <span class="credential-platform">${cred.platform === 'socialtoaster' ? 'LuckySeat / SocialToaster' : 'BroadwayDirect'}</span>
          </div>
          <button
            type="button"
            class="credential-delete"
            data-platform="${cred.platform}"
            data-email="${cred.email}"
          >
            Delete
          </button>
        </div>
      `).join('');

      // Add delete handlers
      credentialsListEl.querySelectorAll('.credential-delete').forEach((btn) => {
        btn.addEventListener('click', handleDeleteCredential);
      });
    }
  } catch (error) {
    console.error('Error loading credentials:', error);
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
  event.preventDefault();

  const settings = {
    openaiApiKey: openaiApiKeyInput.value.trim(),
    defaultEmail: defaultEmailInput.value.trim(),
    defaultFirstName: defaultFirstNameInput.value.trim(),
    defaultLastName: defaultLastNameInput.value.trim(),
    autoApplyEnabled: autoApplyEnabledInput.checked,
    autoApplyTime: autoApplyTimeInput.value,
  };

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      payload: settings,
    });

    if (response.success) {
      showMessage('Settings saved successfully!', 'success');
    } else {
      showMessage(response.error || 'Failed to save settings', 'error');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    showMessage('Failed to save settings', 'error');
  }
}

/**
 * Handle adding a new credential
 */
async function handleAddCredential() {
  const platform = newPlatformInput.value;
  const email = newEmailInput.value.trim();
  const password = newPasswordInput.value;

  if (!email || !password) {
    showMessage('Please enter email and password', 'error');
    return;
  }

  try {
    const result = await chrome.storage.sync.get('credentials');
    const credentials = result.credentials || [];

    const exists = credentials.some((c) => c.platform === platform && c.email === email);
    if (exists) {
      showMessage('This credential already exists', 'error');
      return;
    }

    credentials.push({
      id: `${platform}:${email}`,
      platform,
      email,
      encryptedPassword: btoa(password),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await chrome.storage.sync.set({ credentials });

    newEmailInput.value = '';
    newPasswordInput.value = '';
    addCredentialForm.classList.add('hidden');

    await loadCredentials();
    showMessage('Credential added successfully', 'success');
  } catch (error) {
    console.error('Error adding credential:', error);
    showMessage('Failed to add credential', 'error');
  }
}

/**
 * Handle deleting a credential
 */
async function handleDeleteCredential(event) {
  const platform = event.currentTarget.dataset.platform;
  const email = event.currentTarget.dataset.email;

  if (!confirm(`Delete credential for ${email} on ${platform}?`)) {
    return;
  }

  try {
    const result = await chrome.storage.sync.get('credentials');
    const credentials = result.credentials || [];

    const filtered = credentials.filter(
      (c) => !(c.platform === platform && c.email === email)
    );

    await chrome.storage.sync.set({ credentials: filtered });
    await loadCredentials();
    showMessage('Credential deleted', 'success');
  } catch (error) {
    console.error('Error deleting credential:', error);
    showMessage('Failed to delete credential', 'error');
  }
}

/**
 * Handle clearing lottery history
 */
async function handleClearHistory() {
  if (!confirm('Are you sure you want to clear all lottery history?')) {
    return;
  }

  try {
    await chrome.storage.local.remove('lotteryHistory');
    showMessage('Lottery history cleared', 'success');
  } catch (error) {
    console.error('Error clearing history:', error);
    showMessage('Failed to clear history', 'error');
  }
}

/**
 * Handle exporting all data
 */
async function handleExportData() {
  try {
    const syncData = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get(null);

    const exportData = {
      exportDate: new Date().toISOString(),
      syncData,
      localData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haman-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showMessage('Data exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting data:', error);
    showMessage('Failed to export data', 'error');
  }
}

/**
 * Show a message to the user
 */
function showMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 5000);
}

// Event Listeners
settingsForm.addEventListener('submit', handleSubmit);

addCredentialBtn.addEventListener('click', () => {
  addCredentialForm.classList.toggle('hidden');
});

cancelCredentialBtn.addEventListener('click', () => {
  addCredentialForm.classList.add('hidden');
  newEmailInput.value = '';
  newPasswordInput.value = '';
});

saveCredentialBtn.addEventListener('click', handleAddCredential);
clearHistoryBtn.addEventListener('click', handleClearHistory);
exportDataBtn.addEventListener('click', handleExportData);

// Initialize
init();
