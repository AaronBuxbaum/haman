import { describe, test, expect } from 'bun:test';
import { 
  setUserOverride, 
  getUserOverride, 
  getAllUserOverrides,
  deleteUserOverride,
  savePlatformCredentials,
  getPlatformCredentials,
  getDecryptedPassword
} from './kvStorage';

describe('KV Storage', () => {
  const testUserId = 'test-user-123';
  const testShowName = 'Hamilton';
  const testPlatform = 'socialtoaster';

  describe('User Overrides', () => {
    test('should set and get a user override', async () => {
      const override = await setUserOverride(testUserId, testShowName, testPlatform, true);
      
      expect(override.userId).toBe(testUserId);
      expect(override.showName).toBe(testShowName);
      expect(override.platform).toBe(testPlatform);
      expect(override.shouldApply).toBe(true);

      const retrieved = await getUserOverride(testUserId, testShowName, testPlatform);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.shouldApply).toBe(true);
    });

    test('should get all overrides for a user', async () => {
      await setUserOverride(testUserId, 'Hamilton', 'socialtoaster', true);
      await setUserOverride(testUserId, 'Wicked', 'socialtoaster', false);
      
      const overrides = await getAllUserOverrides(testUserId);
      expect(overrides.length).toBeGreaterThanOrEqual(2);
    });

    test('should delete a user override', async () => {
      await setUserOverride(testUserId, testShowName, testPlatform, true);
      await deleteUserOverride(testUserId, testShowName, testPlatform);
      
      const retrieved = await getUserOverride(testUserId, testShowName, testPlatform);
      expect(retrieved).toBeNull();
    });
  });

  describe('Platform Credentials', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'test-password-123';

    test('should save and get platform credentials', async () => {
      const credentials = await savePlatformCredentials(
        testUserId,
        'socialtoaster',
        testEmail,
        testPassword
      );

      expect(credentials.userId).toBe(testUserId);
      expect(credentials.platform).toBe('socialtoaster');
      expect(credentials.email).toBe(testEmail);
      expect(credentials.encryptedPassword).not.toBe(testPassword);

      const retrieved = await getPlatformCredentials(testUserId, 'socialtoaster');
      expect(retrieved.length).toBeGreaterThanOrEqual(1);
      
      const found = retrieved.find(c => c.email === testEmail);
      expect(found).toBeDefined();
    });

    test('should decrypt password correctly', async () => {
      const credentials = await savePlatformCredentials(
        testUserId,
        'broadwaydirect',
        'test2@example.com',
        testPassword
      );

      const decrypted = getDecryptedPassword(credentials);
      expect(decrypted).toBe(testPassword);
    });

    test('should support multiple credentials per platform', async () => {
      await savePlatformCredentials(testUserId, 'socialtoaster', 'user1@example.com', 'pass1');
      await savePlatformCredentials(testUserId, 'socialtoaster', 'user2@example.com', 'pass2');
      
      const credentials = await getPlatformCredentials(testUserId, 'socialtoaster');
      expect(credentials.length).toBeGreaterThanOrEqual(2);
    });
  });
});
