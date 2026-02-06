import { UserOverride, PlatformCredentials } from './types';

/**
 * Vercel KV storage utilities for user overrides and credentials
 * Falls back to in-memory storage if KV is not configured
 */

// In-memory storage fallback
const inMemoryStorage = new Map<string, unknown>();

// Check if KV is available
let kvClient: typeof import('@vercel/kv').kv | null = null;
try {
  if (process.env.KV_URL || process.env.KV_REST_API_URL) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const kvModule = require('@vercel/kv');
    kvClient = kvModule.kv;
  }
} catch (error) {
  console.warn('Vercel KV not available, using in-memory storage');
}

const OVERRIDE_PREFIX = 'override:';
const CREDENTIALS_PREFIX = 'credentials:';

// Helper functions for storage abstraction
async function getValue<T>(key: string): Promise<T | null> {
  if (kvClient) {
    return await kvClient.get<T>(key);
  }
  return (inMemoryStorage.get(key) as T) || null;
}

async function setValue<T>(key: string, value: T): Promise<void> {
  if (kvClient) {
    await kvClient.set(key, value);
  } else {
    inMemoryStorage.set(key, value);
  }
}

async function deleteValue(key: string): Promise<void> {
  if (kvClient) {
    await kvClient.del(key);
  } else {
    inMemoryStorage.delete(key);
  }
}

async function getKeys(pattern: string): Promise<string[]> {
  if (kvClient) {
    return await kvClient.keys(pattern);
  } else {
    // Simple pattern matching for in-memory storage
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return Array.from(inMemoryStorage.keys()).filter(key => regex.test(key));
  }
}

/**
 * Get user override for a specific show
 */
export async function getUserOverride(
  userId: string,
  showName: string,
  platform: string
): Promise<UserOverride | null> {
  const key = `${OVERRIDE_PREFIX}${userId}:${platform}:${showName}`;
  const data = await getValue<UserOverride>(key);
  return data;
}

/**
 * Set user override for a specific show
 */
export async function setUserOverride(
  userId: string,
  showName: string,
  platform: string,
  shouldApply: boolean
): Promise<UserOverride> {
  const key = `${OVERRIDE_PREFIX}${userId}:${platform}:${showName}`;
  const override: UserOverride = {
    userId,
    showName,
    platform: platform as 'socialtoaster' | 'broadwaydirect',
    shouldApply,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await setValue(key, override);
  return override;
}

/**
 * Get all overrides for a user
 */
export async function getAllUserOverrides(userId: string): Promise<UserOverride[]> {
  const pattern = `${OVERRIDE_PREFIX}${userId}:*`;
  const keys = await getKeys(pattern);
  
  if (keys.length === 0) return [];
  
  const overrides: UserOverride[] = [];
  for (const key of keys) {
    const data = await getValue<UserOverride>(key);
    if (data) overrides.push(data);
  }
  
  return overrides;
}

/**
 * Delete user override
 */
export async function deleteUserOverride(
  userId: string,
  showName: string,
  platform: string
): Promise<void> {
  const key = `${OVERRIDE_PREFIX}${userId}:${platform}:${showName}`;
  await deleteValue(key);
}

/**
 * Simple encryption/decryption for passwords
 * In production, use a proper encryption library with key management
 */
function encryptPassword(password: string): string {
  // This is a placeholder - in production use proper encryption
  // with a secret key from environment variables
  return Buffer.from(password).toString('base64');
}

function decryptPassword(encrypted: string): string {
  // This is a placeholder - in production use proper decryption
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}

/**
 * Save platform credentials for a user
 */
export async function savePlatformCredentials(
  userId: string,
  platform: 'socialtoaster' | 'broadwaydirect',
  email: string,
  password: string
): Promise<PlatformCredentials> {
  const id = `${userId}:${platform}:${email}`;
  const key = `${CREDENTIALS_PREFIX}${id}`;
  
  const credentials: PlatformCredentials = {
    id,
    userId,
    platform,
    email,
    encryptedPassword: encryptPassword(password),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setValue(key, credentials);
  return credentials;
}

/**
 * Get platform credentials for a user
 */
export async function getPlatformCredentials(
  userId: string,
  platform: 'socialtoaster' | 'broadwaydirect'
): Promise<PlatformCredentials[]> {
  const pattern = `${CREDENTIALS_PREFIX}${userId}:${platform}:*`;
  const keys = await getKeys(pattern);
  
  if (keys.length === 0) return [];
  
  const credentials: PlatformCredentials[] = [];
  for (const key of keys) {
    const data = await getValue<PlatformCredentials>(key);
    if (data) credentials.push(data);
  }
  
  return credentials;
}

/**
 * Get decrypted password for credentials
 */
export function getDecryptedPassword(credentials: PlatformCredentials): string {
  return decryptPassword(credentials.encryptedPassword);
}

/**
 * Delete platform credentials
 */
export async function deletePlatformCredentials(
  userId: string,
  platform: string,
  email: string
): Promise<void> {
  const id = `${userId}:${platform}:${email}`;
  const key = `${CREDENTIALS_PREFIX}${id}`;
  await deleteValue(key);
}

/**
 * Get all credentials for a user (all platforms)
 */
export async function getAllUserCredentials(userId: string): Promise<PlatformCredentials[]> {
  const pattern = `${CREDENTIALS_PREFIX}${userId}:*`;
  const keys = await getKeys(pattern);
  
  if (keys.length === 0) return [];
  
  const credentials: PlatformCredentials[] = [];
  for (const key of keys) {
    const data = await getValue<PlatformCredentials>(key);
    if (data) credentials.push(data);
  }
  
  return credentials;
}
