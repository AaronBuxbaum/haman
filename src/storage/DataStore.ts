import { User, LotteryEntry } from '../types';

/**
 * Abstract data persistence layer
 * Custom implementation for Haman lottery system
 */
export abstract class DataStore {
  // User persistence
  abstract persistUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<User>;
  abstract findUserById(userId: string): Promise<User | null>;
  abstract findUserByEmailAddress(emailAddress: string): Promise<User | null>;
  abstract queryAllUsers(): Promise<User[]>;
  abstract modifyUser(userId: string, modifications: Partial<User>): Promise<User | null>;
  abstract removeUser(userId: string): Promise<void>;

  // Lottery entry persistence
  abstract recordLotteryAttempt(entryData: Omit<LotteryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LotteryEntry>;
  abstract findLotteryAttempt(entryId: string): Promise<LotteryEntry | null>;
  abstract queryUserLotteryHistory(userId: string, maxResults?: number): Promise<LotteryEntry[]>;
  abstract modifyLotteryAttempt(entryId: string, modifications: Partial<LotteryEntry>): Promise<LotteryEntry | null>;

  // Lifecycle
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;

  // Utility for generating unique identifiers
  protected createUniqueId(category: string): string {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `${category}-${timestamp}-${randomPart}`;
  }
}
