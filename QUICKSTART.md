# Quick Start Guide

This guide will help you get started with the Broadway Lottery Automation system in under 5 minutes.

## Prerequisites

- Node.js 18 or higher
- npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- AWS account (for deployment only)

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/AaronBuxbaum/haman.git
cd haman
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

4. **Build the project**
```bash
npm run build
```

## Local Testing

Run the example script to see the system in action:

```bash
npm run dev
```

This will:
1. Create an example user with preferences: "I love musicals, especially Hamilton and Wicked"
2. Parse preferences using GPT-4
3. Find matching shows from the catalog
4. (In simulation mode) Apply to matching lotteries

Expected output:
```
Creating example user...
User created: { id: 'user_...', email: 'user@example.com', ... }
Parsed preferences: { genres: ['musical'], showNames: ['Hamilton', 'Wicked'] }

Matching shows: ['Hamilton', 'Wicked', 'The Lion King', 'Book of Mormon', 'Chicago', 'Moulin Rouge']

Applying to lotteries...
Applying to Hamilton lottery on SocialToaster...
Successfully applied to Hamilton on SocialToaster
...
```

## Creating Your First User

Edit `src/index.ts` to customize the example:

```typescript
const user = await service.createUser(
  'your-email@example.com',
  'I want to see Hamilton and Wicked, but not The Lion King',
  'Your First Name',  // Optional
  'Your Last Name'    // Optional
);
```

### Preference Examples

The AI can understand natural language preferences:

**Simple preferences:**
```
"I love musicals"
"I want to see Hamilton"
```

**Genre-based:**
```
"I'm interested in musicals and dramas"
"Comedy shows only"
```

**With exclusions:**
```
"Any show except The Lion King"
"All musicals but not comedies"
```

**With dates:**
```
"Shows in January and February"
"Available next month"
```

**With price constraints:**
```
"Tickets under $50"
"Price range $30-$75"
```

## Deployment to AWS Lambda

### Setup AWS Credentials

Configure AWS CLI with your credentials:
```bash
aws configure
```

### Deploy

```bash
npm run deploy
```

This will:
1. Build the TypeScript code
2. Package the application
3. Create Lambda function
4. Set up CloudWatch Events for scheduling
5. Configure IAM roles and permissions

### Schedule Configuration

The system runs twice daily by default:
- **9:00 AM EST** (14:00 UTC) - Primary run
- **11:00 AM EST** (16:00 UTC) - Backup run

Edit `serverless.yml` to customize:

```yaml
events:
  - schedule:
      rate: cron(0 14 * * ? *)  # Daily at 9 AM EST
```

### View Logs

```bash
serverless logs -f applyLotteries
```

### Invoke Manually

```bash
serverless invoke -f applyLotteries
```

## Understanding the Show Catalog

The system includes a catalog of Broadway shows in `src/showCatalog.ts`:

```typescript
{
  name: 'Hamilton',
  platform: 'socialtoaster',
  url: 'https://www.luckyseat.com/hamilton',
  genre: 'musical',
  active: true
}
```

### Adding New Shows

Edit `src/showCatalog.ts` and add shows to the `BROADWAY_SHOWS` array:

```typescript
{
  name: 'Your Show Name',
  platform: 'socialtoaster', // or 'broadwaydirect'
  url: 'https://lottery-url.com/your-show',
  genre: 'musical', // or 'drama', 'comedy', etc.
  active: true
}
```

**Note**: The URLs in the default catalog are examples. You'll need to update them with actual lottery URLs.

## Production Considerations

### Database

The current implementation uses in-memory storage. For production:

1. **Migrate to DynamoDB**
   - Create a DynamoDB table
   - Update `src/database.ts` to use AWS SDK
   - Add encryption at rest

2. **Or use PostgreSQL RDS**
   - Set up RDS instance
   - Install pg driver: `npm install pg`
   - Update database implementation

### User Management

For production, implement:
- User authentication (OAuth, JWT)
- Email verification
- User dashboard/web interface
- Preference editing UI

### Monitoring

Set up:
- CloudWatch Alarms for failures
- Email notifications for results
- Success/failure tracking
- Cost monitoring

### Rate Limiting

Implement:
- Per-user application limits
- Platform-specific rate limits
- Exponential backoff on failures

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
npm run build
```

### "OPENAI_API_KEY not found"
Make sure `.env` file exists and contains your API key.

### Build errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Lambda deployment fails
- Check AWS credentials: `aws sts get-caller-identity`
- Verify sufficient IAM permissions
- Check Lambda limits in your region

## Next Steps

1. **Update Show URLs**: Replace example URLs with actual lottery URLs
2. **Test with Real Lotteries**: Try a real lottery application (carefully!)
3. **Add More Shows**: Expand the show catalog
4. **Set Up Database**: Migrate from in-memory to DynamoDB
5. **Build Web Interface**: Create user signup/management UI

## Getting Help

- **Documentation**: See `README.md` and `ARCHITECTURE.md`
- **Security**: See `SECURITY.md`
- **Issues**: Open an issue on GitHub
- **Community**: Join discussions on GitHub

## Legal Notice

This tool is for educational purposes. Ensure compliance with:
- Broadway lottery terms of service
- Rate limiting policies
- Data protection regulations (GDPR, etc.)
- Applicable laws in your jurisdiction

Always respect the rules and guidelines of lottery platforms.
