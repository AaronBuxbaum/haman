import { User, LotteryEntry } from '../types';
import { DataStore } from './DataStore';

/**
 * Volatile memory-based data store
 * Suitable for development and quick prototyping
 */
export class VolatileStore extends DataStore {
  private userRecords = new Map<string, User>();
  private lotteryRecords = new Map<string, LotteryEntry>();

  async initialize(): Promise<void> {
    // Volatile store needs no initialization
  }

  async shutdown(): Promise<void> {
    this.userRecords.clear();
    this.lotteryRecords.clear();
  }

  async persistUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<User> {
    const currentTime = new Date();
    const newUser: User = {
      ...userData,
      id: this.createUniqueId('usr'),
      createdAt: currentTime,
      updatedAt: currentTime
    };
    
    this.userRecords.set(newUser.id, newUser);
    return newUser;
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.userRecords.get(userId) || null;
  }

  async findUserByEmailAddress(emailAddress: string): Promise<User | null> {
    for (const user of this.userRecords.values()) {
      if (user.email === emailAddress) {
        return user;
      }
    }
    return null;
  }

  async queryAllUsers(): Promise<User[]> {
    return Array.from(this.userRecords.values());
  }

  async modifyUser(userId: string, modifications: Partial<User>): Promise<User | null> {
    const existingUser = this.userRecords.get(userId);
    if (!existingUser) return null;

    const updatedUser: User = {
      ...existingUser,
      ...modifications,
      id: existingUser.id,
      createdAt: existingUser.createdAt,
      updatedAt: new Date()
    };

    this.userRecords.set(userId, updatedUser);
    return updatedUser;
  }

  async removeUser(userId: string): Promise<void> {
    this.userRecords.delete(userId);
  }

  async recordLotteryAttempt(entryData: Omit<LotteryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<LotteryEntry> {
    const currentTime = new Date();
    const newEntry: LotteryEntry = {
      ...entryData,
      id: this.createUniqueId('lot'),
      createdAt: currentTime,
      updatedAt: currentTime
    };

    this.lotteryRecords.set(newEntry.id, newEntry);
    return newEntry;
  }

  async findLotteryAttempt(entryId: string): Promise<LotteryEntry | null> {
    return this.lotteryRecords.get(entryId) || null;
  }

  async queryUserLotteryHistory(userId: string, maxResults?: number): Promise<LotteryEntry[]> {
    const userEntries: LotteryEntry[] = [];
    
    for (const entry of this.lotteryRecords.values()) {
      if (entry.userId === userId) {
        userEntries.push(entry);
      }
    }

    userEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return maxResults ? userEntries.slice(0, maxResults) : userEntries;
  }

  async modifyLotteryAttempt(entryId: string, modifications: Partial<LotteryEntry>): Promise<LotteryEntry | null> {
    const existingEntry = this.lotteryRecords.get(entryId);
    if (!existingEntry) return null;

    const updatedEntry: LotteryEntry = {
      ...existingEntry,
      ...modifications,
      id: existingEntry.id,
      createdAt: existingEntry.createdAt,
      updatedAt: new Date()
    };

    this.lotteryRecords.set(entryId, updatedEntry);
    return updatedEntry;
  }
}
