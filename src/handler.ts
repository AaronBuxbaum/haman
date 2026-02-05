import { LotteryService } from './lotteryService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Lambda handler for scheduled lottery applications
 */
export const handler = async (event: unknown) => {
  console.log('Starting scheduled lottery application...');
  console.log('Event:', JSON.stringify(event, null, 2));

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
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

    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('Error in lottery application:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
