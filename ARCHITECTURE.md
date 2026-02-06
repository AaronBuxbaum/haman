# Architecture Documentation

## Overview

Haman is a Broadway lottery automation system that combines AI-powered preference parsing with browser automation to automatically apply to Broadway show lotteries on behalf of users.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Lambda (Serverless)                 │
│                                                              │
│  ┌──────────────┐    ┌─────────────────┐                   │
│  │   Handler    │───>│ Lottery Service │                   │
│  │ (Scheduled)  │    │                 │                   │
│  └──────────────┘    └────────┬────────┘                   │
│                               │                             │
│                      ┌────────┴────────┐                    │
│                      │                 │                    │
│               ┌──────▼──────┐   ┌─────▼──────┐            │
│               │  Preference │   │  Lottery   │            │
│               │   Parser    │   │ Automation │            │
│               │ (Anthropic) │   │(Playwright)│            │
│               └─────────────┘   └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                      │                      │
                      │                      │
                ┌─────▼──────┐         ┌────▼─────────┐
                │ Anthropic  │         │  Broadway    │
                │ Claude API │         │  Lottery     │
                └────────────┘         │  Websites    │
                                       └──────────────┘
```

## Core Components

### 1. User Database (`src/database.ts`)

**Purpose**: Manages user accounts and their preferences.

**Responsibilities**:
- Create, read, update, delete user accounts
- Store user preferences (both raw text and parsed)
- Generate unique user IDs

**Current Implementation**: In-memory Map
**Production Recommendation**: Use AWS DynamoDB or PostgreSQL RDS

```typescript
interface User {
  id: string;
  email: string;
  preferences: string; // Raw text input
  parsedPreferences?: ParsedPreferences; // AI-parsed structure
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Preference Parser (`src/preferenceParser.ts`)

**Purpose**: Converts free-text user preferences into structured data using AI.

**Key Features**:
- Uses Anthropic Claude with JSON mode for reliable parsing
- Extracts: genres, show names, price ranges, date ranges, exclusions
- Validates and normalizes parsed data
- Matches shows against user preferences

**Example**:
```
Input: "I love musicals, especially Hamilton. Avoid The Lion King."
Output: {
  genres: ["musical"],
  showNames: ["Hamilton"],
  excludeShows: ["The Lion King"]
}
```

### 3. Lottery Automation (`src/lotteryAutomation.ts`)

**Purpose**: Browser automation for submitting lottery entries.

**Anti-Detection Strategy**:
1. **Browser Configuration**
   - Disable automation flags
   - Random user agent rotation
   - Realistic viewport and device settings
   - NYC geolocation (where Broadway is)

2. **JavaScript Injection**
   - Hide `navigator.webdriver` property
   - Mock browser plugins
   - Override permission APIs

3. **Human-like Behavior**
   - Random delays (500-3000ms)
   - Variable typing speed (50-150ms per character)
   - Page scrolling simulation
   - Realistic navigation patterns

**Platform Implementations**:
- `SocialToasterAutomation`: For LuckySeat/SocialToaster platform
- `BroadwayDirectAutomation`: For BroadwayDirect platform

### 4. Show Catalog (`src/showCatalog.ts`)

**Purpose**: Maintains list of available Broadway shows and their lottery URLs.

**Data Structure**:
```typescript
interface Show {
  name: string;
  platform: 'socialtoaster' | 'broadwaydirect';
  url: string;
  genre?: string;
  active: boolean;
}
```

**Production Enhancement**: 
- Implement web scraping to automatically discover new lotteries
- Add API integration with Broadway ticketing platforms
- Store in database with admin interface for updates

### 5. Lottery Service (`src/lotteryService.ts`)

**Purpose**: Main orchestration layer that coordinates all components.

**Workflow**:
1. Get all users from database
2. For each user:
   - Parse preferences (if not already parsed)
   - Find matching shows
   - Group shows by platform
   - Initialize browser automation
   - Apply to each matching lottery
   - Collect results
3. Return aggregated results

### 6. Lambda Handler (`src/handler.ts`)

**Purpose**: AWS Lambda entry point for scheduled execution.

**Responsibilities**:
- Load environment variables
- Initialize LotteryService
- Apply for all users
- Return summary statistics

**Invocation**: Triggered by CloudWatch Events (cron schedule)

## Data Flow

### User Registration Flow
```
1. User provides email and preferences text
2. LotteryService.createUser()
3. User saved to database
4. PreferenceParser.parsePreferences() called
5. Anthropic Claude processes text
6. Parsed preferences stored with user
```

### Lottery Application Flow
```
1. Lambda triggered by schedule
2. Handler calls LotteryService.applyForAllUsers()
3. For each user:
   a. Get matching shows using PreferenceParser.matchesPreferences()
   b. Create LotteryAutomation for each platform
   c. Initialize browser with anti-detection
   d. For each show:
      - Navigate to lottery page
      - Fill form with human-like behavior
      - Submit entry
      - Capture result
   e. Cleanup browser resources
4. Return aggregated results
```

## Anti-Detection Measures

### Why Anti-Detection?

Broadway lottery sites use Cloudflare and other anti-bot systems to prevent automated entries. Without proper measures, requests will be blocked.

### Implementation Details

1. **Browser Fingerprinting**
   - Rotate user agents
   - Set realistic viewport sizes
   - Configure proper locale and timezone
   - Add geolocation data

2. **Webdriver Detection**
   - Hide `navigator.webdriver` flag
   - Mock browser plugins
   - Override automation-related properties

3. **Behavioral Analysis**
   - Random delays between actions
   - Variable typing speeds
   - Mouse movement simulation (scrolling)
   - Realistic page load waiting

4. **Network Fingerprinting**
   - Proper HTTP headers
   - Accept-Language headers
   - Security headers (Sec-Fetch-*)
   - Connection keep-alive

## Serverless Deployment

### AWS Lambda Configuration

**Runtime**: Node.js 20.x
**Memory**: 1024 MB (needed for Playwright browser)
**Timeout**: 300 seconds (5 minutes)

**Environment Variables**:
- `ANTHROPIC_API_KEY`: Anthropic API key
- `NODE_ENV`: Environment (production/development)

### Scheduling

**Primary Schedule**: Daily at 9 AM EST (14:00 UTC)
- Most lotteries open around this time
- Cron: `0 14 * * ? *`

**Backup Schedule**: Daily at 11 AM EST (16:00 UTC)
- Catches late-opening lotteries
- Cron: `0 16 * * ? *`

### Deployment

```bash
npm run build
serverless deploy
```

This creates:
- Lambda function with code
- CloudWatch Events rules for scheduling
- IAM roles and permissions
- CloudWatch Logs groups

## Scalability Considerations

### Current Limitations

1. **In-Memory Database**: Won't persist between Lambda invocations
2. **Sequential Processing**: Processes users one at a time
3. **Single Region**: Runs only in us-east-1

### Production Enhancements

1. **Database**
   - Use DynamoDB for user storage
   - Add indexes for efficient queries
   - Implement user authentication

2. **Parallel Processing**
   - Use Lambda concurrency
   - Process multiple users simultaneously
   - Implement SQS queue for job management

3. **Monitoring**
   - CloudWatch metrics and alarms
   - Success/failure tracking
   - Email notifications to users

4. **Show Catalog**
   - Web scraping for automatic updates
   - Admin interface for manual updates
   - Historical tracking of lottery availability

## Error Handling

### Types of Errors

1. **Network Errors**: Timeout, connection refused
2. **Parsing Errors**: Invalid HTML structure
3. **Detection Errors**: Bot detection triggered
4. **API Errors**: Anthropic API failures

### Handling Strategy

- All errors are caught and logged
- Failed applications return `success: false` with error message
- User applications continue even if one show fails
- Retry logic can be added at service level

## Security Considerations

1. **API Keys**: Stored in environment variables, never in code
2. **User Data**: Email addresses should be encrypted at rest (production)
3. **Rate Limiting**: Implement per-user limits to prevent abuse
4. **Authentication**: Add OAuth or JWT for production web interface

## Testing Strategy

### Unit Tests
- PreferenceParser: Test parsing logic with various inputs
- Database: Test CRUD operations
- Matching Logic: Test show matching with different preferences

### Integration Tests
- Full flow from user creation to lottery application
- Mock external APIs (Anthropic, lottery sites)
- Test error handling paths

### Manual Testing
- Test with real lottery URLs
- Verify anti-detection measures work
- Check form submission success

## Future Enhancements

1. **Web Interface**: React/Next.js UI for user management
2. **Email Notifications**: Send results to users
3. **Win Tracking**: Track and display lottery wins
4. **Mobile App**: iOS/Android apps for on-the-go management
5. **More Platforms**: Support additional lottery platforms
6. **Smart Scheduling**: Learn optimal application times per show
7. **Proxy Support**: Rotate IP addresses for better stealth

## Dependencies

### Production Dependencies
- `playwright`: Browser automation
- `@anthropic-ai/sdk`: AI preference parsing
- `aws-sdk`: AWS service integration
- `dotenv`: Environment configuration

### Development Dependencies
- `typescript`: Type safety
- `jest`: Testing framework
- `eslint`: Code linting
- `serverless`: Deployment framework

## Performance Metrics

### Expected Performance
- **Per User Processing**: 30-60 seconds (depends on number of matching shows)
- **Cold Start**: 3-5 seconds (Lambda + Playwright initialization)
- **Warm Start**: 1-2 seconds
- **Cost**: ~$0.01 per 100 applications (Lambda + Anthropic API)

### Optimization Opportunities
1. Keep Lambda warm with CloudWatch Events
2. Cache parsed preferences
3. Reuse browser instances within single invocation
4. Batch Anthropic API calls
