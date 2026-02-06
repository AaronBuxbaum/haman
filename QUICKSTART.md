# Quick Start Guide

Get up and running with Haman in under 5 minutes!

## Prerequisites

- Google Chrome browser (version 88 or later)
- Node.js 18+ (for building from source)
- OpenAI API key (optional, for AI preference matching)

## Installation

### 1. Clone and Build

```bash
# Clone the repository
git clone https://github.com/AaronBuxbaum/haman.git
cd haman

# Install dependencies
npm install

# Build the extension
npm run build
```

### 2. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `extension/dist` directory

You should see the Haman icon (🎭) in your browser toolbar!

## First-Time Setup

### Step 1: Open Settings

1. Click the Haman icon in your browser toolbar
2. Click the **⚙️ Settings** button

### Step 2: Add Your Information

Fill in your details:
- **Email Address**: Your email for lottery entries
- **First Name**: Your first name
- **Last Name**: Your last name

### Step 3: (Optional) Add OpenAI API Key

If you want AI-powered preference matching:
1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Paste it in the **OpenAI API Key** field
3. Save settings

### Step 4: Save Settings

Click **💾 Save Settings**

## Basic Usage

### View Available Shows

1. Click the Haman icon in your toolbar
2. See all available Broadway lottery shows
3. Each show displays its platform and status

### Enable/Disable Shows

- Click the **✓** or **✗** button next to any show
- Green = will apply, Red = won't apply
- Your choices are saved automatically

### Apply to a Lottery

**Method 1: Quick Apply from Popup**
1. Click the **🎯** button next to any show
2. A new tab opens with the lottery page
3. Click the **🎭 Haman** button on the page
4. Review the filled form and click submit

**Method 2: Manual Navigation**
1. Go to any supported lottery page
2. Look for the **🎭 Haman** button in the bottom right
3. Click it to auto-fill the form
4. Review and submit

## Using AI Preferences

If you've added an OpenAI API key:

1. Open the popup and type your preferences:
   > "I love musicals, especially Hamilton and Wicked. No dramas please."

2. Click **🤖 Parse Preferences**

3. Shows will automatically be enabled/disabled based on your preferences

4. You can still manually override any show

## Setting Up Auto-Apply

Want Haman to automatically apply to lotteries?

1. Open **Settings**
2. Check **Enable automatic lottery application**
3. Set your preferred time (e.g., 9:00 AM)
4. Save settings

Haman will automatically:
- Open lottery pages for enabled shows
- Fill in your information
- Submit the forms

> ⚠️ **Note**: Auto-apply works best when your computer is on and Chrome is running.

## Tips & Tricks

### Check Your Lottery History

1. Open the popup
2. Click **View Lottery History** at the bottom
3. See past application attempts and results

### Export Your Data

1. Go to Settings
2. Click **Export All Data**
3. Save the JSON file for backup

### Multiple Shows Same Platform

You can add multiple credentials for the same platform in Settings to enter the same lottery with different email addresses.

## Troubleshooting

### Button Not Appearing on Lottery Pages

- Make sure you're on a supported page (BroadwayDirect or LuckySeat)
- Refresh the page
- Check that the extension is enabled in `chrome://extensions/`

### Form Not Filling

- Open Settings and verify your email/name are saved
- Check the browser console for error messages
- Make sure you're clicking the Haman button, not the site's button

### AI Preferences Not Working

- Verify your OpenAI API key is correct (starts with `sk-`)
- Check that you have API credits available
- Look for error messages in the popup

### Extension Not Loading

- Go to `chrome://extensions/`
- Make sure Developer mode is enabled
- Try clicking the refresh button on the extension
- Rebuild with `npm run build` if needed

## Next Steps

- Explore all the shows in the catalog
- Set up your preferences to automatically match shows
- Configure auto-apply for hands-off lottery entries
- Check your lottery history to track applications

Happy lottery hunting! 🎭
