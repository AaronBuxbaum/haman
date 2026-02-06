# Architecture Documentation

## Overview

Haman is a Broadway lottery automation system implemented as a Chrome browser extension. It uses AI-powered preference parsing to match users with shows and automates lottery entry form filling directly in the user's browser.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Chrome Browser Extension                         │
│                                                                          │
│  ┌──────────────────┐    ┌─────────────────────┐                        │
│  │   Popup UI       │────│  Background Service │                        │
│  │   (popup.html)   │    │  Worker             │                        │
│  └────────┬─────────┘    └──────────┬──────────┘                        │
│           │                         │                                    │
│           │    Chrome Messages      │                                    │
│           └─────────┬───────────────┘                                    │
│                     │                                                    │
│           ┌─────────┴───────────┐                                       │
│           │                     │                                        │
│  ┌────────▼────────┐   ┌───────▼───────┐                                │
│  │   Options Page  │   │ Content Script │                                │
│  │   (Settings)    │   │ (Form Filling) │                                │
│  └─────────────────┘   └───────┬───────┘                                │
│                                │                                         │
└────────────────────────────────┼─────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────▼────────┐       ┌───────▼────────┐
           │  BroadwayDirect │       │   LuckySeat    │
           │   Lottery Pages │       │ Lottery Pages  │
           └─────────────────┘       └────────────────┘
                    
                                 ▲
                                 │ (Optional)
                        ┌────────┴────────┐
                        │   OpenAI API    │
                        │   GPT-4         │
                        └─────────────────┘
```

## Core Components

### 1. Popup UI (`extension/popup/`)

**Purpose**: Main user interface accessible from the browser toolbar.

**Files**:
- `popup.html` - HTML structure
- `popup.css` - Styles
- `popup.js` - Interactive logic

**Features**:
- Display all available Broadway shows
- Show enable/disable toggles
- Preference input and AI parsing
- Quick access to lottery pages
- Lottery history viewing

**Communication**: Uses Chrome runtime messaging to communicate with background service worker.

### 2. Options Page (`extension/options/`)

**Purpose**: Full settings configuration page.

**Files**:
- `options.html` - HTML structure
- `options.css` - Styles
- `options.js` - Settings management

**Settings**:
- OpenAI API key configuration
- Default user information (email, name)
- Automatic application scheduling
- Platform credentials management
- Data export/clear functionality

### 3. Background Service Worker (`extension/background/background.js`)

**Purpose**: Centralized state management and background tasks.

**Responsibilities**:
- Handle all Chrome storage operations
- Process messages from popup and content scripts
- Manage scheduled alarms for automatic applications
- Parse preferences using OpenAI API
- Coordinate lottery applications

**Key Functions**:
- `handleMessage()` - Central message router
- `getShowsWithPreferences()` - Match shows to user preferences
- `handleDailyApply()` - Execute scheduled lottery applications
- `parsePreferencesWithAI()` - Call OpenAI for preference parsing

### 4. Content Script (`extension/content/content.js`)

**Purpose**: Automates lottery form filling on supported pages.

**Injection**: Automatically injected on BroadwayDirect and LuckySeat domains.

**Features**:
- Detect lottery pages by hostname
- Inject floating "Haman" button
- Auto-fill forms with human-like behavior
- Support both manual and automatic submission
- Show visual notifications

**Anti-Detection**:
- Random delays between actions (50-800ms)
- Character-by-character typing simulation
- Proper event dispatching (input, change)
- Smooth scrolling before clicks

### 5. Shared Libraries (`extension/lib/`)

**Storage (`storage.js`)**:
- Chrome storage API wrapper
- Preference persistence
- Override management
- Credential storage

**Show Catalog (`showCatalog.js`)**:
- Known Broadway show database
- URL-to-show mapping
- Hostname validation

**Preference Parser (`preferenceParser.js`)**:
- OpenAI API integration
- Preference normalization
- Show matching logic

## Data Flow

### User Enable/Disable Show

```
1. User clicks toggle in popup
2. popup.js sends SET_OVERRIDE message
3. Background worker receives message
4. Override stored in chrome.storage.sync
5. Background returns success
6. Popup refreshes show list
```

### Manual Lottery Application

```
1. User clicks "🎯" button in popup
2. New tab opens with lottery URL
3. Content script detects lottery page
4. Content script injects Haman button
5. User clicks Haman button
6. Content script requests settings from background
7. Form fields filled with user data
8. User manually clicks submit
```

### Automatic Lottery Application

```
1. Chrome alarm triggers at scheduled time
2. Background worker executes handleDailyApply()
3. Gets all enabled shows from storage
4. For each enabled show:
   a. Opens new background tab with lottery URL
   b. Waits for page load
   c. Sends FILL_LOTTERY_FORM message to content script
   d. Content script fills and submits form
   e. Result logged to lottery history
5. All tabs processed sequentially
```

### AI Preference Parsing

```
1. User enters preferences in popup
2. User clicks "Parse Preferences"
3. popup.js sends PARSE_PREFERENCES message
4. Background worker retrieves OpenAI API key
5. Background calls OpenAI API with user text
6. OpenAI returns structured JSON
7. Parsed preferences stored in chrome.storage.sync
8. Shows re-evaluated against preferences
9. Popup refreshes to show matches
```

## Storage Schema

### chrome.storage.sync (Synced across devices)

```javascript
{
  settings: {
    openaiApiKey: string?,
    defaultEmail: string?,
    defaultFirstName: string?,
    defaultLastName: string?,
    autoApplyEnabled: boolean,
    autoApplyTime: string // "HH:MM"
  },
  overrides: [
    {
      showName: string,
      platform: 'socialtoaster' | 'broadwaydirect',
      shouldApply: boolean,
      createdAt: string,
      updatedAt: string
    }
  ],
  credentials: [
    {
      id: string,
      platform: string,
      email: string,
      encodedPassword: string, // Base64 encoded
      createdAt: string,
      updatedAt: string
    }
  ],
  preferences: string, // Raw user preference text
  parsedPreferences: {
    genres: string[]?,
    showNames: string[]?,
    excludeShows: string[]?,
    keywords: string[]?
  }
}
```

### chrome.storage.local (Device-specific)

```javascript
{
  shows: [
    {
      name: string,
      platform: string,
      url: string,
      genre: string?,
      active: boolean
    }
  ],
  showsTimestamp: number,
  lotteryHistory: [
    {
      success: boolean,
      showName: string,
      platform: string,
      error: string?,
      timestamp: string
    }
  ]
}
```

## Security Considerations

### URL Validation
- All URL checks use `URL` constructor for proper parsing
- Hostname validation instead of substring matching
- Prevents URL manipulation attacks

### Password Storage
- Passwords are base64 encoded (obfuscation only)
- Chrome's storage.sync provides some encryption
- Users should understand this is not full encryption

### API Key Handling
- OpenAI API key stored in chrome.storage.sync
- Never exposed to content scripts
- Only used in background worker context

### Content Script Isolation
- Content scripts run in isolated world
- Cannot access page JavaScript context
- DOM manipulation only

## Supported Platforms

### BroadwayDirect
- **Domain**: `lottery.broadwaydirect.com`
- **Shows**: Aladdin, Wicked, The Lion King, Hamilton, MJ, Six, etc.
- **Form Fields**: Email, First Name, Last Name

### LuckySeat (SocialToaster)
- **Domain**: `www.luckyseat.com`
- **Shows**: Hadestown, Moulin Rouge, Book of Mormon, Chicago, etc.
- **Form Fields**: Email, First Name, Last Name

## Extension Permissions

```json
{
  "permissions": [
    "storage",     // Store settings and preferences
    "alarms",      // Schedule automatic applications
    "activeTab",   // Access current tab
    "scripting"    // Inject content scripts
  ],
  "host_permissions": [
    "https://lottery.broadwaydirect.com/*",
    "https://www.luckyseat.com/*",
    "https://api.openai.com/*"
  ]
}
```

## Development

### Build Process

```bash
npm run build
```

This runs `extension/build.sh` which:
1. Creates dist directory
2. Copies all source files
3. Copies icons and assets

### Loading Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist/`

### Testing

1. Configure settings in extension options
2. Navigate to lottery page
3. Verify Haman button appears
4. Click button to test form filling
5. Check console for logs

## Future Enhancements

- [ ] Web scraping for dynamic show catalog updates
- [ ] Win tracking and statistics
- [ ] Multiple user profile support
- [ ] Firefox/Edge compatibility
- [ ] Lottery result notifications
- [ ] Advanced scheduling options

## Legacy Code

The `pages/`, `src/`, and `styles/` directories contain the previous serverless/Next.js implementation. These are preserved for reference but are no longer the primary implementation.
