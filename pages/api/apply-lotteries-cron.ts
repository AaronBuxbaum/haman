import { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { LotteryService } from '../../src/lotteryService';

/**
 * API endpoint for applying to Broadway lotteries for all users
 * This can be triggered via HTTP request or scheduled via Vercel cron
 * POST /api/apply-lotteries-cron
 * 
 * This endpoint applies to lotteries for ALL users in the system.
 * For applying to lotteries for a specific user, use /api/apply-lotteries instead.
 */

/**
 * Timing-safe comparison of authorization tokens
 * Prevents timing attacks by ensuring constant-time comparison
 */
function isAuthorized(authHeader: string | undefined, expectedSecret: string | undefined): boolean {
  if (!authHeader || !expectedSecret) {
    return false;
  }
  
  const expectedAuth = `Bearer ${expectedSecret}`;
  
  // Ensure both strings are same length for timingSafeEqual
  if (authHeader.length !== expectedAuth.length) {
    return false;
  }
  
  try {
    const authBuffer = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expectedAuth);
    return timingSafeEqual(authBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('Starting lottery application for all users...');
  console.log('Request method:', req.method);

  // Verify authorization for manual triggers
  const authHeader = req.headers.authorization;
  const cronHeader = req.headers['x-vercel-cron'];
  
  // Allow requests from Vercel cron or with valid authorization
  if (!cronHeader && !isAuthorized(authHeader, process.env.CRON_SECRET)) {
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
