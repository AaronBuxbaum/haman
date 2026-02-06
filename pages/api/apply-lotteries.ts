import { NextApiRequest, NextApiResponse } from 'next';
import { LotteryService } from '../../src/lotteryService';
import { getPlatformCredentials } from '../../src/kvStorage';

/**
 * POST /api/apply-lotteries
 * Apply to all desired shows for a user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, preferences, firstName, lastName } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || '';
    const lotteryService = new LotteryService(openaiApiKey);

    // Create or update user
    let user = lotteryService.getUserDatabase().getUserByEmail(email);
    if (!user) {
      user = await lotteryService.createUser(email, preferences || '', firstName, lastName);
    } else if (preferences) {
      await lotteryService.updateUserPreferences(user.id, preferences);
    }

    // Get user credentials for platforms (for future use with multiple accounts)
    await getPlatformCredentials(userId, 'socialtoaster');
    await getPlatformCredentials(userId, 'broadwaydirect');
    
    // TODO: Pass credentials to lottery automation
    // For now, this will use the basic automation without platform-specific credentials

    // Apply to lotteries
    const results = await lotteryService.applyForUser(user.id);

    return res.status(200).json({ 
      success: true, 
      results,
      message: `Applied to ${results.length} lotteries`
    });
  } catch (error) {
    console.error('Error applying to lotteries:', error);
    return res.status(500).json({ 
      error: 'Failed to apply to lotteries',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
