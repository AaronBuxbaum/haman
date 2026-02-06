import { UserDatabase } from './database';
import { PreferenceParser } from './preferenceParser';
import { createLotteryAutomation, LotteryResult } from './lotteryAutomation';
import { getActiveShows } from './showCatalog';
import { User, Show } from './types';

/**
 * Main service for orchestrating lottery applications
 */
export class LotteryService {
  private userDb: UserDatabase;
  private preferenceParser: PreferenceParser;

  constructor(openaiApiKey: string) {
    this.userDb = new UserDatabase();
    this.preferenceParser = new PreferenceParser(openaiApiKey);
  }

  /**
   * Create a new user and parse their preferences
   */
  async createUser(email: string, preferencesText: string, firstName?: string, lastName?: string): Promise<User> {
    const user = this.userDb.createUser(email, preferencesText, firstName, lastName);

    try {
      const parsedPreferences = await this.preferenceParser.parsePreferences(preferencesText);
      this.userDb.updateUserPreferences(user.id, preferencesText, parsedPreferences);
      user.parsedPreferences = parsedPreferences;
    } catch (error) {
      console.error('Failed to parse preferences:', error);
    }

    return user;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferencesText: string): Promise<User | undefined> {
    const parsedPreferences = await this.preferenceParser.parsePreferences(preferencesText);
    return this.userDb.updateUserPreferences(userId, preferencesText, parsedPreferences);
  }

  /**
   * Get matching shows for a user based on their preferences
   */
  getMatchingShows(user: User): Show[] {
    if (!user.parsedPreferences) {
      return [];
    }

    const allShows = getActiveShows();
    return allShows.filter(show =>
      this.preferenceParser.matchesPreferences(show, user.parsedPreferences!)
    );
  }

  /**
   * Apply to lotteries for a single user
   */
  async applyForUser(userId: string): Promise<LotteryResult[]> {
    const user = this.userDb.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const matchingShows = this.getMatchingShows(user);
    console.log(`Found ${matchingShows.length} matching shows for user ${user.email}`);

    const results: LotteryResult[] = [];

    // Group shows by platform
    const socialToasterShows = matchingShows.filter(s => s.platform === 'socialtoaster');
    const broadwayDirectShows = matchingShows.filter(s => s.platform === 'broadwaydirect');

    // Apply to SocialToaster lotteries
    if (socialToasterShows.length > 0) {
      const automation = createLotteryAutomation('socialtoaster');
      await automation.initialize();

      for (const show of socialToasterShows) {
        const result = await automation.applyToLottery(show, user);
        results.push(result);
      }

      await automation.cleanup();
    }

    // Apply to BroadwayDirect lotteries
    if (broadwayDirectShows.length > 0) {
      const automation = createLotteryAutomation('broadwaydirect');
      await automation.initialize();

      for (const show of broadwayDirectShows) {
        const result = await automation.applyToLottery(show, user);
        results.push(result);
      }

      await automation.cleanup();
    }

    return results;
  }

  /**
   * Apply to lotteries for all users
   */
  async applyForAllUsers(): Promise<Map<string, LotteryResult[]>> {
    const users = this.userDb.getAllUsers();
    const resultsByUser = new Map<string, LotteryResult[]>();

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.email}`);
        const results = await this.applyForUser(user.id);
        resultsByUser.set(user.id, results);
        
        // TODO: Add email notification integration here
        // await this.notifyUser(user, results);
        
        // TODO: Store results in persistent database
        // await this.saveLotteryResults(user.id, results);
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        resultsByUser.set(user.id, []);
      }
    }

    return resultsByUser;
  }

  /**
   * Get user database (for testing/debugging)
   */
  getUserDatabase(): UserDatabase {
    return this.userDb;
  }
}
