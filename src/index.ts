import { LotteryService } from './lotteryService';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Example CLI usage
 */
async function main() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  const service = new LotteryService(openaiApiKey);

  // Example: Create a user with preferences
  console.log('Creating example user...');
  const user = await service.createUser(
    'user@example.com',
    'I love musicals, especially Hamilton and Wicked. I want to see any musical on Broadway.'
  );

  console.log('User created:', user);
  console.log('Parsed preferences:', user.parsedPreferences);

  // Get matching shows
  const matchingShows = service.getMatchingShows(user);
  console.log('\nMatching shows:', matchingShows.map(s => s.name));

  // Apply to lotteries
  console.log('\nApplying to lotteries...');
  const results = await service.applyForUser(user.id);

  console.log('\nResults:');
  results.forEach(result => {
    console.log(`- ${result.showName} (${result.platform}): ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });
}

if (require.main === module) {
  main().catch(console.error);
}
