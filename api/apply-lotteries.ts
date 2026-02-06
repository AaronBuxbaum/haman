import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LotteryService } from '../src/lotteryService';

/**
 * Vercel serverless function for applying to Broadway lotteries
 * This can be triggered via HTTP request or scheduled via Vercel cron
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  console.log('Starting lottery application...');
  console.log('Request method:', req.method);

  // Verify authorization for manual triggers
  const authHeader = req.headers.authorization;
  const cronHeader = req.headers['x-vercel-cron'];
  
  // Allow requests from Vercel cron or with valid authorization
  if (!cronHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    return res.status(500).json({ 
      error: 'OPENAI_API_KEY environment variable is required' 
    });
  }

  const service = new LotteryService(openaiApiKey);

  try {
    const results = await service.applyForAllUsers();

    const summary = {
      totalUsers: results.size,
      totalApplications: Array.from(results.values()).flat().length,
      successful: Array.from(results.values()).flat().filter(r => r.success).length,
      failed: Array.from(results.values()).flat().filter(r => !r.success).length,
      details: Object.fromEntries(results)
    };

    console.log('Lottery application summary:', summary);

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error in lottery application:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
