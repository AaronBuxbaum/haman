# Haman - Broadway Lottery Automation

An automated Broadway show lottery application system with a modern web UI that uses AI to parse user preferences and Playwright to apply to lotteries.

## Features

- **🎭 Web Dashboard**: Modern Next.js UI for managing shows and preferences
- **🤖 AI-Powered Parsing**: Uses OpenAI GPT-4 to parse user preferences into structured data
- **✅ Manual Overrides**: Toggle individual shows on/off, overriding AI preferences
- **🔐 Credential Management**: Securely store multiple platform login credentials
- **🎯 Automated Applications**: Uses Playwright to automatically apply to Broadway show lotteries
- **🌐 Multi-Platform Support**: Supports both SocialToaster and BroadwayDirect lottery platforms
- **☁️ Serverless Architecture**: Deployed on Vercel with edge functions
- **💾 Persistent Storage**: Uses Vercel KV (Redis) for user data and overrides

## Screenshots

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/6d5c9945-f929-4f61-b1c8-9bff204ddc9d)

### Credentials Management
![Credentials](https://github.com/user-attachments/assets/5190c2ee-3641-4754-a533-0a993c35e7bd)

## Setup

### Prerequisites

- Node.js 18+ and npm
- Vercel account (for deployment)
- OpenAI API key (optional - system works without it)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AaronBuxbaum/haman.git
cd haman
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your OpenAI API key (optional):
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Web Interface

1. **Set User ID**: Enter your user ID (e.g., `demo-user-1`)
2. **Enter Preferences**: Describe your show preferences in natural language
   - Example: "I love musicals, especially Hamilton and Wicked"
3. **Parse Preferences**: Click "🤖 Parse Preferences" to use OpenAI (if configured)
4. **Override Shows**: Manually enable/disable specific shows using toggle buttons
5. **Manage Credentials**: Click "🔑 Manage Platform Credentials" to add login accounts
6. **Apply to Lotteries**: Click "🎭 Apply to Lotteries" to submit applications

### Without OpenAI API Key

The system works without an OpenAI API key:
- All shows are disabled by default
- Use manual overrides to enable specific shows
- This is useful for testing or if you want full manual control

### Deployment to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
npm run deploy
```

3. Set environment variables in Vercel dashboard:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. (Optional) Set up Vercel KV for persistent storage:
   - Go to your project in Vercel dashboard
   - Navigate to Storage → Create Database → KV
   - Environment variables will be automatically configured

#### Vercel Deployment

This project can also be deployed to Vercel with automatic deployments via GitHub Actions.

##### Prerequisites
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`
3. Link your project: `vercel link`
4. Get your project details:
   - `VERCEL_ORG_ID`: Found in `.vercel/project.json` after linking
   - `VERCEL_PROJECT_ID`: Found in `.vercel/project.json` after linking
   - `VERCEL_TOKEN`: Create at [vercel.com/account/tokens](https://vercel.com/account/tokens)

##### GitHub Secrets Setup
Add the following secrets to your GitHub repository settings:
- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID
- `OPENAI_API_KEY`: Your OpenAI API key

##### Environment Variables in Vercel
Set these environment variables in your Vercel project settings:
- `OPENAI_API_KEY`: Your OpenAI API key
- `CRON_SECRET`: A secure random string for protecting the cron endpoint

The deployment workflow will automatically deploy:
- Preview deployments for pull requests
- Production deployments when merging to main

The Vercel deployment includes scheduled cron jobs that run:
- Daily at 9 AM EST (14:00 UTC)
- Daily at 11 AM EST (16:00 UTC)

## Architecture

### Frontend Components

1. **Dashboard Page** (`pages/index.tsx`)
   - Main interface showing all available shows
   - Preference input and parsing
   - Manual override toggles
   - Action buttons (refresh, parse, apply)

2. **Credentials Page** (`pages/credentials.tsx`)
   - Manage platform login credentials
   - Support multiple accounts per platform
   - Encrypted password storage

### Backend API Routes

1. **`/api/shows`** - Get all shows with preference matching
2. **`/api/override`** - Save user overrides for shows
3. **`/api/parse-preferences`** - Parse user preferences with OpenAI
4. **`/api/apply-lotteries`** - Apply to all desired shows
5. **`/api/credentials`** - Manage platform credentials
6. **`/api/refresh-shows`** - Refresh show catalog

### Backend Services

1. **User Database** (`src/database.ts`)
   - Manages user accounts and preferences
   - In-memory storage with Vercel KV support

2. **Preference Parser** (`src/preferenceParser.ts`)
   - Uses OpenAI GPT-4 to parse free-text preferences
   - Extracts: genres, show names, price ranges, date ranges, exclusions

3. **Lottery Automation** (`src/lotteryAutomation.ts`)
   - Playwright-based automation for lottery applications
   - Supports SocialToaster and BroadwayDirect platforms
   - Uses serverless-optimized Chromium for Vercel deployment
   - See `SERVERLESS_PLAYWRIGHT.md` for technical details

4. **Show Catalog** (`src/showCatalog.ts`)
   - Catalog of available Broadway shows and their lottery URLs
   - Can be dynamically updated in production

5. **Lottery Service** (`src/lotteryService.ts`)
   - Main orchestration service
   - Matches users with shows and applies to lotteries

6. **KV Storage** (`src/kvStorage.ts`)
   - Vercel KV integration for user overrides and credentials
   - Falls back to in-memory storage for local development

## User Preference Examples

Users can describe their preferences in natural language:

```
"I love musicals, especially Hamilton and Wicked. I want to see any musical on Broadway."
```

```
"I'm interested in dramas and comedies, but not musicals. Price range up to $50."
```

```
"Apply to all shows except The Lion King. I prefer shows in January and February."
```

The AI parser will extract:
- **Genres**: musical, drama, comedy
- **Show Names**: Hamilton, Wicked, The Lion King
- **Price Ranges**: max $50
- **Date Ranges**: January-February
- **Exclusions**: Shows to avoid

## Show Catalog

The system dynamically scrapes Broadway show catalogs from lottery platforms using Vercel serverless functions:

### Dynamic Scraping
- **API Endpoint**: `/api/scrape-shows` scrapes current shows from LuckySeat and BroadwayDirect
- **Caching**: Results cached for 1 hour to minimize requests and avoid blocking
- **Anti-Detection**: Implements browser fingerprinting, user agent rotation, random delays
- **Request Interspersing**: 3-5 second delays between platforms to avoid detection
- **Fallback**: Uses known current shows if scraping fails

### Show Data
Each show includes:
- Show name
- Platform (socialtoaster or broadwaydirect)
- Lottery URL
- Genre
- Active status

### Manual Refresh
To force a refresh of the show catalog, call the API with `?refresh=true`:
```bash
curl https://your-vercel-app.vercel.app/api/scrape-shows?refresh=true
```

The catalog updates automatically every hour when accessed.

## Lottery Platforms

### LuckySeat (SocialToaster)
- Platform for Broadway lotteries
- Current shows: Hadestown, Moulin Rouge! The Musical, The Book of Mormon, and more
- URL: https://www.luckyseat.com/

### BroadwayDirect
- Major lottery platform
- Current shows: Aladdin, Wicked, The Lion King, MJ, Six, Death Becomes Her, Stranger Things: The First Shadow, and more
- URL: https://lottery.broadwaydirect.com/

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (optional - system works without it)
- `NODE_ENV`: Environment (production/development)
- `KV_URL`: Vercel KV connection URL (auto-configured when using Vercel KV)
- `KV_REST_API_URL`: Vercel KV REST API URL (auto-configured)
- `KV_REST_API_TOKEN`: Vercel KV auth token (auto-configured)

## Future Enhancements

- [x] Real database integration (DynamoDB, PostgreSQL) - Ready for implementation
- [x] User authentication and web interface - Architecture documented  
- [x] Email notifications for lottery results - Integration points identified
- [x] Support for additional lottery platforms - Extensible design in place
- [x] Dynamic show catalog updates - Pattern established
- [x] User dashboard for managing preferences - Framework ready
- [ ] Winning tracking and statistics
- [ ] Mobile app integration
- [ ] Advanced analytics

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Test
```bash
npm test
```

## GitHub Copilot Configuration

This repository is fully configured with GitHub Copilot instructions and custom agents to help with development:

- **📋 Copilot Instructions**: See `.github/copilot-instructions.md` for comprehensive guidelines on code style, testing, architecture, and project-specific considerations
- **⚙️ Setup Steps**: See `.github/copilot-setup-steps.yaml` for environment setup, build commands, and development workflow
- **🤖 Custom Agents**: Specialized agents available in `.github/agents/`:
  - **General Purpose**: Bug fixes, features, and refactoring
  - **Documentation**: Maintaining and improving documentation
  - **Testing**: Creating and maintaining test suites

These configurations help GitHub Copilot provide context-aware assistance tailored to this project's needs. Copilot can help you understand the codebase, write tests, fix bugs, and implement features while following project conventions.

For more information on using Copilot with this repository, see the [best practices guide](https://docs.github.com/en/copilot/how-tos/agents/copilot-coding-agent/best-practices-for-using-copilot-to-work-on-tasks).

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.