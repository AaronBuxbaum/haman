import { UserDatabase } from './database';

describe('UserDatabase', () => {
  let db: UserDatabase;

  beforeEach(() => {
    db = new UserDatabase();
  });

  describe('createUser', () => {
    it('should create a user with required fields', () => {
      const user = db.createUser('test@example.com', 'I love musicals');
      
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.preferences).toBe('I love musicals');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with optional fields', () => {
      const user = db.createUser('test@example.com', 'I love musicals', 'John', 'Doe');
      
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });

    it('should generate unique IDs for different users', () => {
      const user1 = db.createUser('user1@example.com', 'preferences1');
      const user2 = db.createUser('user2@example.com', 'preferences2');
      
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('getUser', () => {
    it('should retrieve a user by ID', () => {
      const created = db.createUser('test@example.com', 'preferences');
      const retrieved = db.getUser(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.email).toBe('test@example.com');
    });

    it('should return undefined for non-existent user', () => {
      const user = db.getUser('non-existent-id');
      expect(user).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should retrieve a user by email', () => {
      const created = db.createUser('test@example.com', 'preferences');
      const retrieved = db.getUserByEmail('test@example.com');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent email', () => {
      const user = db.getUserByEmail('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });

  describe('getAllUsers', () => {
    it('should return empty array when no users exist', () => {
      const users = db.getAllUsers();
      expect(users).toEqual([]);
    });

    it('should return all users', () => {
      db.createUser('user1@example.com', 'pref1');
      db.createUser('user2@example.com', 'pref2');
      db.createUser('user3@example.com', 'pref3');
      
      const users = db.getAllUsers();
      expect(users).toHaveLength(3);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', () => {
      const user = db.createUser('test@example.com', 'old preferences');
      const originalUpdatedAt = user.updatedAt;
      
      // Small delay to ensure updatedAt changes
      const parsedPrefs = { genres: ['musical'] };
      const updated = db.updateUserPreferences(user.id, 'new preferences', parsedPrefs);
      
      expect(updated).toBeDefined();
      expect(updated?.preferences).toBe('new preferences');
      expect(updated?.parsedPreferences).toEqual(parsedPrefs);
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should return undefined for non-existent user', () => {
      const updated = db.updateUserPreferences('non-existent-id', 'new preferences');
      expect(updated).toBeUndefined();
    });
  });

  describe('deleteUser', () => {
    it('should delete an existing user', () => {
      const user = db.createUser('test@example.com', 'preferences');
      
      const deleted = db.deleteUser(user.id);
      expect(deleted).toBe(true);
      
      const retrieved = db.getUser(user.id);
      expect(retrieved).toBeUndefined();
    });

    it('should return false for non-existent user', () => {
      const deleted = db.deleteUser('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});
