# Haman - Broadway Lottery Automation

A Chrome browser extension that automatically applies to Broadway show lotteries with AI-powered preference matching. The extension runs directly in your browser, automating lottery entries on platforms like BroadwayDirect and LuckySeat.

## Features

- **🎭 Browser Extension**: Runs in your own Chrome browser - no serverless functions needed
- **🤖 AI-Powered Parsing**: Uses OpenAI GPT-4 to parse your show preferences
- **✅ Manual Overrides**: Toggle individual shows on/off, overriding AI preferences
- **🔐 Credential Management**: Securely store platform login credentials locally
- **🎯 One-Click Application**: Click the Haman button on any lottery page to auto-fill forms
- **⏰ Scheduled Applications**: Optionally set up automatic daily lottery applications
- **💾 Local Storage**: All data stored securely in your browser

## Screenshots

### Popup Dashboard
The extension popup shows all available Broadway shows with their lottery status:
- Green checkmark: Enabled for lottery application
- Red cross: Disabled
- Click to toggle any show on/off

### Settings Page
Configure your:
- OpenAI API key for AI preference parsing
- Default user information (email, name) for lottery forms
- Automatic application schedule
- Platform credentials

## Installation

### From Source (Developer Mode)

1. Clone the repository:
```bash
git clone https://github.com/AaronBuxbaum/haman.git
cd haman
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension/dist` directory

### From Chrome Web Store
*Coming soon*

## Usage

### Quick Start

1. **Install the extension** (see Installation above)
2. **Configure settings**: Click the extension icon, then ⚙️ Settings
   - Add your email and name for lottery forms
   - (Optional) Add your OpenAI API key for AI preferences
3. **Set preferences**: In the popup, describe your show preferences
   - Example: "I love musicals, especially Hamilton and Wicked"
4. **Enable shows**: Toggle shows on/off as desired
5. **Apply to lotteries**: 
   - Visit a lottery page and click the 🎭 Haman button, OR
   - Click the 🎯 button next to any show in the popup

### On Lottery Pages

When you visit a supported lottery page (BroadwayDirect or LuckySeat), you'll see:
- A floating 🎭 Haman button in the bottom right
- Click it to auto-fill the lottery form with your saved information
- Review the form and click submit

### AI Preference Matching

If you configure an OpenAI API key:
1. Enter your preferences in natural language
2. Click "🤖 Parse Preferences"
3. Shows will automatically be enabled/disabled based on your preferences

Example preferences:
- "I love musicals, especially Hamilton and Wicked"
- "I'm interested in dramas and comedies, but not musicals"
- "Apply to all shows except The Lion King"

### Automatic Applications

Enable scheduled applications in Settings:
1. Check "Enable automatic lottery application"
2. Set your preferred time (e.g., 9:00 AM when lotteries open)
3. The extension will automatically open and fill lottery forms for enabled shows

## Supported Platforms

- **BroadwayDirect** (lottery.broadwaydirect.com)
  - Aladdin, Wicked, The Lion King, Hamilton, MJ, Six, and more
- **LuckySeat / SocialToaster** (luckyseat.com)
  - Hadestown, Moulin Rouge, The Book of Mormon, Chicago, and more

## Privacy & Security

- **Local Storage**: All data (preferences, credentials, history) is stored locally in your browser using Chrome's storage API
- **No Server**: The extension runs entirely in your browser - no data is sent to external servers (except OpenAI for preference parsing, if configured)
- **Password Handling**: Platform passwords are base64 encoded for basic obfuscation (not true encryption)
- **API Key**: Your OpenAI API key is stored locally and only used for preference parsing

## Development

### Project Structure

```
extension/
├── manifest.json        # Extension manifest
├── background/          # Service worker
│   └── background.ts
├── content/             # Content scripts for lottery pages
│   └── content.ts
├── popup/               # Extension popup UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.ts
├── options/             # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.ts
├── lib/                 # Shared utilities
│   ├── types.ts
│   ├── storage.ts
│   ├── preferenceParser.ts
│   └── showCatalog.ts
└── icons/               # Extension icons
```

### Building

```bash
# Install dependencies
npm install

# Build extension
npm run build

# The built extension is in extension/dist/
```

### Development Workflow

1. Make changes to TypeScript files in `extension/`
2. Run `npm run build` to compile
3. In Chrome, go to `chrome://extensions/`
4. Click the refresh icon on the Haman extension
5. Test your changes

### Linting

```bash
npm run lint
```

## Configuration

### Environment Variables

None required! The extension stores all configuration locally in your browser.

### Settings (in extension)

| Setting | Description |
|---------|-------------|
| OpenAI API Key | Optional. Enables AI preference parsing |
| Default Email | Your email for lottery entries |
| First Name | Your first name for lottery entries |
| Last Name | Your last name for lottery entries |
| Auto-Apply | Enable/disable scheduled applications |
| Apply Time | When to run automatic applications |

## Comparison: Extension vs. Serverless

This project was previously a serverless application. Here's why we moved to a Chrome extension:

| Feature | Chrome Extension | Serverless (Previous) |
|---------|-----------------|----------------------|
| Bot Detection | ✅ Runs in real browser | ❌ Easily detected |
| Privacy | ✅ All data local | ⚠️ Data on server |
| Cost | ✅ Free | ⚠️ API/hosting costs |
| Setup | ✅ Just install | ⚠️ Deploy + configure |
| Reliability | ✅ Your own browser | ⚠️ Server availability |

## Troubleshooting

### Extension not loading
- Make sure you're in Developer mode in `chrome://extensions/`
- Check the console for errors (click "background page" link in extension details)

### Form not filling
- Make sure you've saved your email/name in Settings
- Check that you're on a supported lottery page
- Try refreshing the page

### AI parsing not working
- Verify your OpenAI API key is correct
- Check that you have API credits available
- The key should start with `sk-`

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting (`npm run lint`)
5. Submit a pull request

## License

MIT

## Legacy (Serverless Version)

The previous serverless/Next.js version is still available in the repository but is no longer the primary deployment method. Files in `pages/`, `src/`, and `styles/` are from the legacy version.
