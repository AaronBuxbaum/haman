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

  // Clear the field first (handles both empty and pre-filled fields)
  element.value = '';
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
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
 * Select an option in a dropdown/select element
 */
async function selectOption(selectElement, value) {
  selectElement.focus();
  await randomDelay(100, 200);
  selectElement.value = value;
  selectElement.dispatchEvent(new Event('change', { bubbles: true }));
  await randomDelay(100, 200);
}

/**
 * Detect the current lottery platform using hostname validation
 */
function detectPlatform() {
  try {
    const hostname = window.location.hostname;

    // Check for exact match or subdomain of broadwaydirect.com
    if (hostname === 'lottery.broadwaydirect.com' || 
        hostname.endsWith('.broadwaydirect.com')) {
      return 'broadwaydirect';
    }

    // Check for exact match or subdomain of luckyseat.com  
    if (hostname === 'luckyseat.com' || 
        hostname === 'www.luckyseat.com' ||
        hostname.endsWith('.luckyseat.com')) {
      return 'socialtoaster';
    }
  } catch (e) {
    console.error('Haman: Error detecting platform', e);
  }

  return null;
}

/**
 * Find and click the "Enter Now" button on BroadwayDirect lottery listing
 * Returns true if button was found and clicked
 */
async function clickEnterNowButton() {
  // Look for "Enter Now" link/button on the lottery listing page
  const enterButtons = Array.from(document.querySelectorAll('a, button')).filter((el) => {
    const text = el.textContent?.toLowerCase().trim();
    return text === 'enter now' || text === 'enter lottery' || text === 'enter';
  });

  if (enterButtons.length > 0) {
    console.log('Haman: Found "Enter Now" button, clicking...');
    await clickElement(enterButtons[0]);
    // Wait for form to load
    await randomDelay(1500, 2500);
    return true;
  }

  return false;
}

/**
 * Wait for an element to appear in the DOM
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Find form elements on BroadwayDirect
 * BroadwayDirect lottery form includes: first name, last name, quantity, email, DOB, zip, country, terms, recaptcha
 */
function findBroadwayDirectElements() {
  // First name input
  const firstNameInput = document.querySelector(
    'input[name="dlslot_name_first"], input[name="firstName"], input[name="first_name"], ' +
    'input[id*="first" i][type="text"], input[placeholder*="first name" i]'
  );

  // Last name input
  const lastNameInput = document.querySelector(
    'input[name="dlslot_name_last"], input[name="lastName"], input[name="last_name"], ' +
    'input[id*="last" i][type="text"], input[placeholder*="last name" i]'
  );

  // Number of tickets dropdown
  const ticketQuantitySelect = document.querySelector(
    'select[name="dlslot_ticket_qty"], select[name="num_tickets"], select[name="quantity"], ' +
    'select[id*="ticket" i], select[id*="qty" i], select[id*="quantity" i]'
  );

  // Email input
  const emailInput = document.querySelector(
    'input[name="dlslot_email"], input[type="email"], input[name="email"], ' +
    'input[id*="email" i], input[placeholder*="email" i]'
  );

  // Date of birth fields (month, day, year dropdowns or single input)
  const dobMonthSelect = document.querySelector(
    'select[name="dlslot_dob_month"], select[name="dob_month"], select[id*="month" i]'
  );
  const dobDaySelect = document.querySelector(
    'select[name="dlslot_dob_day"], select[name="dob_day"], select[id*="day" i]'
  );
  const dobYearSelect = document.querySelector(
    'select[name="dlslot_dob_year"], select[name="dob_year"], select[id*="year" i]'
  );

  // Zip code input
  const zipInput = document.querySelector(
    'input[name="dlslot_zip"], input[name="zip"], input[name="zipcode"], input[name="postal_code"], ' +
    'input[id*="zip" i], input[placeholder*="zip" i]'
  );

  // Country select
  const countrySelect = document.querySelector(
    'select[name="dlslot_country"], select[name="country"], select[id*="country" i]'
  );

  // Terms and conditions checkbox
  const termsCheckbox = document.querySelector(
    'input[name="dlslot_agree"], input[name="agree"], input[name="terms"], ' +
    'input[type="checkbox"][id*="terms" i], input[type="checkbox"][id*="agree" i], ' +
    'input[type="checkbox"][name*="agree" i]'
  );

  // reCAPTCHA checkbox (if accessible - often in iframe)
  const recaptchaCheckbox = document.querySelector(
    '.recaptcha-checkbox, #recaptcha-anchor, .rc-anchor-checkbox'
  );

  // Submit button - look for "Enter" button specifically
  const submitButton = document.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) || Array.from(document.querySelectorAll('button')).find((btn) => {
    const text = btn.textContent?.toLowerCase().trim();
    return text === 'enter' || text === 'submit' || text === 'enter lottery';
  });

  return { 
    firstNameInput, 
    lastNameInput, 
    ticketQuantitySelect,
    emailInput, 
    dobMonthSelect,
    dobDaySelect,
    dobYearSelect,
    zipInput,
    countrySelect,
    termsCheckbox,
    recaptchaCheckbox,
    submitButton 
  };
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
 * Fill the BroadwayDirect lottery form
 */
async function fillBroadwayDirectForm(elements, data) {
  let filledFields = 0;

  // Fill first name
  if (elements.firstNameInput && data.firstName) {
    console.log('Haman: Filling first name field');
    await typeText(elements.firstNameInput, data.firstName);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Fill last name
  if (elements.lastNameInput && data.lastName) {
    console.log('Haman: Filling last name field');
    await typeText(elements.lastNameInput, data.lastName);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Select number of tickets (default to 2)
  if (elements.ticketQuantitySelect) {
    const quantity = data.ticketQuantity || '2';
    console.log(`Haman: Selecting ${quantity} tickets`);
    await selectOption(elements.ticketQuantitySelect, quantity);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Fill email
  if (elements.emailInput && data.email) {
    console.log('Haman: Filling email field');
    await typeText(elements.emailInput, data.email);
    await randomDelay(300, 600);
    filledFields++;
  } else if (data.email && !elements.emailInput) {
    console.log('Haman: Email field not found');
  }

  // Fill date of birth
  if (data.dateOfBirth) {
    const [year, month, day] = data.dateOfBirth.split('-');
    
    if (elements.dobMonthSelect && month) {
      console.log('Haman: Selecting birth month');
      // Remove leading zero for month if present
      await selectOption(elements.dobMonthSelect, parseInt(month, 10).toString());
      await randomDelay(150, 300);
      filledFields++;
    }

    if (elements.dobDaySelect && day) {
      console.log('Haman: Selecting birth day');
      await selectOption(elements.dobDaySelect, parseInt(day, 10).toString());
      await randomDelay(150, 300);
      filledFields++;
    }

    if (elements.dobYearSelect && year) {
      console.log('Haman: Selecting birth year');
      await selectOption(elements.dobYearSelect, year);
      await randomDelay(150, 300);
      filledFields++;
    }
  }

  // Fill zip code
  if (elements.zipInput && data.zipCode) {
    console.log('Haman: Filling zip code');
    await typeText(elements.zipInput, data.zipCode);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Select country
  if (elements.countrySelect && data.country) {
    console.log('Haman: Selecting country');
    await selectOption(elements.countrySelect, data.country);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Check terms and conditions
  if (elements.termsCheckbox && !elements.termsCheckbox.checked) {
    console.log('Haman: Checking terms and conditions');
    await clickElement(elements.termsCheckbox);
    await randomDelay(200, 400);
    filledFields++;
  }

  // Try to click reCAPTCHA if accessible (usually in iframe, so may not work)
  if (elements.recaptchaCheckbox) {
    console.log('Haman: Attempting to click reCAPTCHA');
    try {
      await clickElement(elements.recaptchaCheckbox);
      await randomDelay(500, 1000);
    } catch (e) {
      console.log('Haman: Could not click reCAPTCHA (likely in iframe)');
    }
  }

  return filledFields;
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

  // For BroadwayDirect, we may need to click "Enter Now" first
  if (platform === 'broadwaydirect') {
    // Check if we're on a lottery listing page (not the form page)
    const hasEnterNow = await clickEnterNowButton();
    if (hasEnterNow) {
      console.log('Haman: Clicked "Enter Now", waiting for form...');
      await randomDelay(1500, 2500);
    }

    // Get form elements
    const elements = findBroadwayDirectElements();
    
    // Fill the form with all fields
    const filledCount = await fillBroadwayDirectForm(elements, data);
    console.log(`Haman: Filled ${filledCount} fields`);

    // Submit the form (if autoSubmit is enabled)
    if (data.autoSubmit && elements.submitButton) {
      console.log('Haman: Submitting form');
      await clickElement(elements.submitButton);
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
      filledFields: filledCount,
    };
  }

  // LuckySeat/SocialToaster
  const elements = findSocialToasterElements();

  // Fill email
  if (elements.emailInput && data.email) {
    console.log('Haman: Filling email field');
    await typeText(elements.emailInput, data.email);
    await randomDelay(300, 600);
  } else if (data.email) {
    console.log('Haman: Email field not found');
  }

  // Fill first name (if available)
  if (elements.firstNameInput && data.firstName) {
    console.log('Haman: Filling first name field');
    await typeText(elements.firstNameInput, data.firstName);
    await randomDelay(200, 400);
  }

  // Fill last name (if available)
  if (elements.lastNameInput && data.lastName) {
    console.log('Haman: Filling last name field');
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
 * Scrape and discover shows from the current page
 */
async function discoverShowsFromPage() {
  const platform = detectPlatform();
  if (!platform) return;

  const currentUrl = window.location.href;
  const showName = getShowNameFromPage();

  // Add the current page as a discovered show
  if (showName && showName !== 'Unknown Show') {
    try {
      await chrome.runtime.sendMessage({
        type: 'ADD_DISCOVERED_SHOW',
        payload: {
          show: {
            name: showName,
            platform,
            url: currentUrl,
            genre: 'musical', // Default genre, could be enhanced
          },
        },
      });
    } catch (e) {
      console.log('Haman: Could not save discovered show:', e);
    }
  }
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
        const result = await fillLotteryForm({
          email: settings.defaultEmail,
          firstName: settings.defaultFirstName,
          lastName: settings.defaultLastName,
          dateOfBirth: settings.dateOfBirth,
          zipCode: settings.zipCode,
          country: settings.country || 'US',
          ticketQuantity: settings.ticketQuantity || '2',
          autoSubmit: false,
        });

        if (result.filledFields > 0) {
          showNotification(`Form filled! (${result.filledFields} fields) Review and click submit.`, 'success');
        } else {
          showNotification('Form filled! Review and click submit.', 'success');
        }
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
    
    // Discover and save this show to the catalog
    discoverShowsFromPage();
  }
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}
