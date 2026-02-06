# Haman - Broadway Lottery Automation

An automated Broadway show lottery application system that uses AI to parse user preferences and Playwright to apply to lotteries.

## Features

- **User Accounts**: Create accounts with free-text descriptions of show preferences
- **AI-Powered Parsing**: Uses OpenAI GPT-4 to parse user preferences into structured data
- **Automated Applications**: Uses Playwright to automatically apply to Broadway show lotteries
- **Multi-Platform Support**: Supports both SocialToaster and BroadwayDirect lottery platforms
- **Serverless Architecture**: Runs on AWS Lambda with scheduled triggers for optimal timing

## Setup

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured (for deployment)
- OpenAI API key

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

3. Create a `.env` file with your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

4. Build the project:
```bash
npm run build
```

## Usage

### Local Development

Run the example CLI:
```bash
npm run dev
```

This will:
1. Create an example user with preferences
2. Parse preferences using GPT-4
3. Find matching shows
4. Apply to lotteries (in test mode)

### Deployment

#### AWS Lambda Deployment

Deploy to AWS Lambda:
```bash
npm run deploy
```

The function will run automatically on schedule:
- Daily at 9 AM EST (when most lotteries open)
- Daily at 11 AM EST (backup for late-opening lotteries)

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

### Components

1. **User Database** (`src/database.ts`)
   - Manages user accounts and preferences
   - In-memory storage (replace with DynamoDB/PostgreSQL in production)

2. **Preference Parser** (`src/preferenceParser.ts`)
   - Uses OpenAI GPT-4 to parse free-text preferences
   - Extracts: genres, show names, price ranges, date ranges, exclusions

3. **Lottery Automation** (`src/lotteryAutomation.ts`)
   - Playwright-based automation for lottery applications
   - Supports SocialToaster and BroadwayDirect platforms

4. **Show Catalog** (`src/showCatalog.ts`)
   - Catalog of available Broadway shows and their lottery URLs
   - Can be dynamically updated in production

5. **Lottery Service** (`src/lotteryService.ts`)
   - Main orchestration service
   - Matches users with shows and applies to lotteries

6. **Lambda Handler** (`src/handler.ts`)
   - AWS Lambda function handler
   - Scheduled execution entry point

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

The system includes a catalog of Broadway shows with:
- Show name
- Platform (socialtoaster or broadwaydirect)
- Lottery URL
- Genre
- Active status

Shows can be added/removed by updating `src/showCatalog.ts`.

## Lottery Platforms

### SocialToaster
- Popular platform for Broadway lotteries
- Examples: Hamilton, Wicked, The Lion King

### BroadwayDirect
- Another major lottery platform
- Examples: Book of Mormon, Chicago, Moulin Rouge

## Serverless Configuration

The system uses AWS Lambda with scheduled triggers:

```yaml
# Daily at 9 AM EST
- schedule:
    rate: cron(0 14 * * ? *)

# Daily at 11 AM EST (backup)
- schedule:
    rate: cron(0 16 * * ? *)
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `NODE_ENV`: Environment (production/development)

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

This repository is configured with GitHub Copilot instructions and custom agents to help with development:

- **Copilot Instructions**: See `.github/copilot-instructions.md` for comprehensive guidelines on code style, testing, architecture, and project-specific considerations
- **Custom Agents**: Specialized agents available in `.github/agents/`:
  - **General Purpose**: Bug fixes, features, and refactoring
  - **Documentation**: Maintaining and improving documentation
  - **Testing**: Creating and maintaining test suites

These configurations help Copilot provide context-aware assistance tailored to this project's needs.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.