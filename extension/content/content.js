/**
 * Content script for the Haman Chrome Extension
 * Handles lottery form detection and automation on lottery pages
 */

/**
 * Utility function to add a random delay (simulating human behavior)
 */
function randomDelay(min = 300, max = 800) {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

/**
 * Type text into an input field with human-like delays
 */
async function typeText(element, text) {
  element.focus();
  await randomDelay(100, 200);

  for (const char of text) {
    element.value += char;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    await randomDelay(30, 100);
  }

  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Click an element with human-like behavior
 */
async function clickElement(element) {
  await randomDelay(200, 500);
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await randomDelay(200, 400);
  element.click();
}

/**
 * Detect the current lottery platform
 */
function detectPlatform() {
  const url = window.location.href;

  if (url.includes('lottery.broadwaydirect.com')) {
    return 'broadwaydirect';
  }

  if (url.includes('luckyseat.com')) {
    return 'socialtoaster';
  }

  return null;
}

/**
 * Find form elements on BroadwayDirect
 */
function findBroadwayDirectElements() {
  const emailInput = document.querySelector(
    'input[type="email"], input[name="email"], input[id*="email"], input[placeholder*="email" i]'
  );

  const firstNameInput = document.querySelector(
    'input[name="firstName"], input[name="first_name"], input[id*="first" i], input[placeholder*="first" i]'
  );

  const lastNameInput = document.querySelector(
    'input[name="lastName"], input[name="last_name"], input[id*="last" i], input[placeholder*="last" i]'
  );

  const submitButton = document.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) || Array.from(document.querySelectorAll('button')).find((btn) =>
    btn.textContent?.toLowerCase().includes('enter') ||
    btn.textContent?.toLowerCase().includes('submit')
  );

  return { emailInput, firstNameInput, lastNameInput, submitButton };
}

/**
 * Find form elements on LuckySeat/SocialToaster
 */
function findSocialToasterElements() {
  const emailInput = document.querySelector(
    'input[type="email"], input[name="email"], input[id*="email"], input[placeholder*="email" i]'
  );

  const firstNameInput = document.querySelector(
    'input[name="firstName"], input[name="first_name"], input[id*="first" i], input[placeholder*="first" i]'
  );

  const lastNameInput = document.querySelector(
    'input[name="lastName"], input[name="last_name"], input[id*="last" i], input[placeholder*="last" i]'
  );

  const submitButton = document.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) || Array.from(document.querySelectorAll('button')).find((btn) =>
    btn.textContent?.toLowerCase().includes('enter') ||
    btn.textContent?.toLowerCase().includes('submit')
  );

  return { emailInput, firstNameInput, lastNameInput, submitButton };
}

/**
 * Fill the lottery form
 */
async function fillLotteryForm(data) {
  const platform = detectPlatform();
  if (!platform) {
    console.log('Haman: Not on a recognized lottery page');
    return { success: false, error: 'Not on a lottery page' };
  }

  console.log(`Haman: Detected ${platform} lottery page`);

  // Wait for page to fully load
  await randomDelay(1000, 2000);

  // Get form elements based on platform
  const elements = platform === 'broadwaydirect'
    ? findBroadwayDirectElements()
    : findSocialToasterElements();

  // Fill email
  if (elements.emailInput && data.email) {
    console.log('Haman: Filling email field');
    elements.emailInput.value = '';
    await typeText(elements.emailInput, data.email);
    await randomDelay(300, 600);
  } else if (data.email) {
    console.log('Haman: Email field not found');
  }

  // Fill first name (if available)
  if (elements.firstNameInput && data.firstName) {
    console.log('Haman: Filling first name field');
    elements.firstNameInput.value = '';
    await typeText(elements.firstNameInput, data.firstName);
    await randomDelay(200, 400);
  }

  // Fill last name (if available)
  if (elements.lastNameInput && data.lastName) {
    console.log('Haman: Filling last name field');
    elements.lastNameInput.value = '';
    await typeText(elements.lastNameInput, data.lastName);
    await randomDelay(200, 400);
  }

  // Submit the form (if autoSubmit is enabled)
  if (data.autoSubmit && elements.submitButton) {
    console.log('Haman: Submitting form');
    await clickElement(elements.submitButton);

    // Wait to see result
    await randomDelay(2000, 3000);

    return {
      success: true,
      showName: getShowNameFromPage(),
      platform,
    };
  }

  return {
    success: true,
    showName: getShowNameFromPage(),
    platform,
    submitted: false,
  };
}

/**
 * Try to extract show name from the page
 */
function getShowNameFromPage() {
  const selectors = [
    'h1',
    '.show-title',
    '.lottery-title',
    '[class*="show-name"]',
    '[class*="title"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.textContent) {
      const text = el.textContent.trim();
      if (text && text.length < 100) {
        return text;
      }
    }
  }

  // Fall back to URL parsing
  const url = window.location.href;
  const match = url.match(/\/show\/([^/?]+)/) || url.match(/\.com\/([^/?]+)/);
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/_/g, ' ');
  }

  return 'Unknown Show';
}

/**
 * Create a floating Haman button on lottery pages
 */
function createHamanButton() {
  if (document.getElementById('haman-button')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'haman-button';
  button.innerHTML = '🎭 Haman';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: transform 0.2s, box-shadow 0.2s;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  button.onmouseover = () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
  };

  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  };

  button.onclick = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response && response.success && response.data) {
        const settings = response.data;
        await fillLotteryForm({
          email: settings.defaultEmail,
          firstName: settings.defaultFirstName,
          lastName: settings.defaultLastName,
          autoSubmit: false,
        });

        showNotification('Form filled! Review and click submit.', 'success');
      } else {
        showNotification('Please configure your settings first.', 'error');
      }
    } catch (error) {
      console.error('Haman: Error filling form:', error);
      showNotification('Error filling form: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  document.body.appendChild(button);
}

/**
 * Show a notification on the page
 */
function showNotification(message, type = 'info') {
  const existing = document.getElementById('haman-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'haman-notification';

  const bgColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';

  notification.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 10001;
    padding: 12px 20px;
    background: ${bgColor};
    color: white;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: hamanSlideIn 0.3s ease-out;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'hamanSlideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Add animation styles
 */
function addStyles() {
  if (document.getElementById('haman-styles')) return;

  const style = document.createElement('style');
  style.id = 'haman-styles';
  style.textContent = `
    @keyframes hamanSlideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes hamanSlideOut {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FILL_LOTTERY_FORM') {
    fillLotteryForm(message.payload)
      .then((result) => {
        chrome.runtime.sendMessage({
          type: 'LOTTERY_RESULT',
          payload: result,
        });
        sendResponse(result);
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});

/**
 * Initialize content script
 */
function initContentScript() {
  const platform = detectPlatform();

  if (platform) {
    console.log(`Haman: Detected ${platform} lottery page`);
    addStyles();
    createHamanButton();
  }
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
