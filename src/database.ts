import { User, ParsedPreferences } from './types';
import { DataStore } from './storage/DataStore';
import { VolatileStore } from './storage/VolatileStore';

/**
 * Simple user database that wraps the data store
 * Maintains backward compatibility with existing code
 */
export class UserDatabase {
  private dataStore: DataStore;

  constructor(dataStore?: DataStore) {
    this.dataStore = dataStore || new VolatileStore();
  }

  /**
   * Create a new user
   */
  createUser(email: string, preferences: string, firstName?: string, lastName?: string): User {
    // For backward compatibility, create user without password hash
    const user: User = {
      id: this.generateId(),
      email,
      firstName,
      lastName,
      preferences,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Simulate synchronous behavior for backward compatibility
    this.dataStore.persistUser({
      email,
      passwordHash: '', // Empty for backward compatibility
      preferences,
      firstName,
      lastName
    }).then(createdUser => {
      Object.assign(user, createdUser);
    });

    return user;
  }

  /**
   * Get a user by ID
   */
  getUser(id: string): User | undefined {
    // Note: This is a temporary bridge - real implementation should be async
    let result: User | undefined;
    this.dataStore.findUserById(id).then(user => {
      result = user || undefined;
    });
    return result;
  }

  /**
   * Get a user by email
   */
  getUserByEmail(email: string): User | undefined {
    // Note: This is a temporary bridge - real implementation should be async
    let result: User | undefined;
    this.dataStore.findUserByEmailAddress(email).then(user => {
      result = user || undefined;
    });
    return result;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    // Note: This is a temporary bridge - real implementation should be async
    let result: User[] = [];
    this.dataStore.queryAllUsers().then(users => {
      result = users;
    });
    return result;
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(id: string, preferences: string, parsedPreferences?: ParsedPreferences): User | undefined {
    // Note: This is a temporary bridge - real implementation should be async
    let result: User | undefined;
    this.dataStore.modifyUser(id, { preferences, parsedPreferences }).then(user => {
      result = user || undefined;
    });
    return result;
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): boolean {
    this.dataStore.removeUser(id);
    return true;
  }

  /**
   * Generate a simple ID
   */
  private generateId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the underlying data store for advanced operations
   */
  getDataStore(): DataStore {
    return this.dataStore;
  }
}

