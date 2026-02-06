# Deployment Guide

This guide explains how to deploy the Haman Broadway Lottery application to Vercel.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- [Vercel CLI](https://vercel.com/docs/cli) installed
- OpenAI API key (optional but recommended)

## Quick Deploy

### Option 1: Deploy with Vercel CLI

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the project root:
```bash
npm run deploy
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **haman** (or your choice)
   - In which directory is your code located? **./**
   - Want to override the settings? **N**

5. Your app will be deployed! The CLI will output the deployment URL.

### Option 2: Deploy with Git Integration

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New..." → "Project"

4. Import your repository

5. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

6. Click "Deploy"

## Environment Variables

### Required Variables

Set these in the Vercel dashboard (Settings → Environment Variables):

1. **OPENAI_API_KEY** (optional but recommended)
   - Your OpenAI API key
   - Get one at https://platform.openai.com/api-keys
   - Value: `sk-...`

### Playwright Browser Configuration

The application uses **@sparticuz/chromium** for serverless browser automation, which is automatically configured for Vercel's serverless environment. No manual browser installation is required - the browser binary is bundled with the deployment.

**Technical Details:**
- Uses `playwright-core` instead of full `playwright` package to reduce bundle size
- Uses `@sparticuz/chromium` for serverless-optimized Chromium binary
- Configured with 1024MB memory for browser automation functions
- 60-second timeout for scraping and lottery application operations

### Vercel KV Setup (Optional)

For persistent storage of user overrides and credentials:

1. Go to your project in Vercel dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **KV** (Redis)
5. Name it (e.g., `haman-kv`)
6. Click **Create**
7. Environment variables will be automatically added:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

**Note**: Without Vercel KV, the app uses in-memory storage, which resets on each deployment.

## Verify Deployment

1. Visit your deployment URL (e.g., `https://haman.vercel.app`)
2. You should see the Broadway Lottery Dashboard
3. Test the functionality:
   - View shows list
   - Toggle show overrides
   - Add credentials (if you set up KV)
   - Parse preferences (if you added OpenAI key)

## Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed
5. Vercel will automatically provision SSL certificate

## Updating the Deployment

### Automatic Deployments

If you connected via Git integration:
- Push to main branch → production deployment
- Push to other branches → preview deployment

### Manual Deployments

With Vercel CLI:
```bash
vercel --prod
```

## Monitoring

### View Logs

```bash
vercel logs [deployment-url]
```

Or view in dashboard: Project → Deployments → Click deployment → Logs

### Analytics

Vercel provides built-in analytics:
- Project → Analytics
- View page views, performance metrics, etc.

## Environment-Specific Configuration

### Development
```bash
npm run dev
# Runs on http://localhost:3000
# Uses .env file for environment variables
```

### Production
- Deployed on Vercel
- Uses environment variables from Vercel dashboard
- Optimized build with static generation where possible

## Troubleshooting

### Build Failures

**Error**: "Module not found"
- **Solution**: Run `npm install` locally and ensure all dependencies are in `package.json`

**Error**: "Build exceeded memory limit"
- **Solution**: Increase memory limit in vercel.json:
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

### Runtime Errors

**Error**: "KV is not defined"
- **Solution**: Either set up Vercel KV or use in-memory storage (default fallback)

**Error**: "OpenAI API error"
- **Solution**: Check that `OPENAI_API_KEY` is set correctly in environment variables

**Error**: "Executable doesn't exist" or Playwright browser errors
- **Solution**: This should not occur with the current setup using `@sparticuz/chromium`
- **If it persists**: Verify that `playwright-core` and `@sparticuz/chromium` are in `dependencies` (not `devDependencies`)
- **For local development**: The serverless Chromium package works in both local and production environments

### Performance Issues

**Slow page loads**
- Check Vercel Analytics for bottlenecks
- Consider enabling Edge Functions
- Optimize images and assets

## Security Best Practices

1. **Never commit secrets**: Keep `.env` in `.gitignore`
2. **Use environment variables**: Store all secrets in Vercel dashboard
3. **Enable HTTPS only**: Vercel does this automatically
4. **Review access logs**: Monitor for suspicious activity
5. **Update dependencies**: Regularly run `npm audit` and update packages

## Scaling Considerations

### Vercel Limits (Free Tier)

- **Bandwidth**: 100GB/month
- **Serverless Function Execution**: 100GB-hours/month
- **Builds**: 100 hours/month
- **Edge Requests**: Unlimited

### Upgrading

If you exceed free tier limits:
1. Go to Account Settings → Billing
2. Upgrade to Pro ($20/month) or Enterprise (custom pricing)
3. Benefits include higher limits, advanced analytics, and team features

## Backup and Recovery

### Data Backup

If using Vercel KV:
- Data is automatically backed up by Vercel
- Consider periodic exports for critical data
- Use the KV API to export data programmatically

### Code Backup

- Code is in Git repository (GitHub/GitLab/Bitbucket)
- Vercel maintains deployment history
- Can rollback to previous deployments from dashboard

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions
