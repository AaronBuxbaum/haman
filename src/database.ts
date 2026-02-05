import { User, ParsedPreferences } from './types';

/**
 * Simple in-memory user database
 * In production, this would be replaced with a real database (DynamoDB, PostgreSQL, etc.)
 */
export class UserDatabase {
  private users: Map<string, User> = new Map();

  /**
   * Create a new user
   */
  createUser(email: string, preferences: string): User {
    const user: User = {
      id: this.generateId(),
      email,
      preferences,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    return user;
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  /**
   * Get a user by email
   */
  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(id: string, preferences: string, parsedPreferences?: ParsedPreferences): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;

    user.preferences = preferences;
    user.parsedPreferences = parsedPreferences;
    user.updatedAt = new Date();

    return user;
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  /**
   * Generate a simple ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
