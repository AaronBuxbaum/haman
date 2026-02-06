export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Password hash for authentication
  firstName?: string; // Optional: user's first name for lotteries that require it
  lastName?: string; // Optional: user's last name for lotteries that require it
  preferences: string; // Free-text description of what shows they want
  parsedPreferences?: ParsedPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParsedPreferences {
  genres?: string[]; // e.g., "musical", "drama", "comedy"
  showNames?: string[]; // Specific show names they want
  priceRange?: {
    min?: number;
    max?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  excludeShows?: string[];
  keywords?: string[]; // Other keywords extracted from preferences
}

export interface LotteryEntry {
  id: string;
  userId: string;
  showName: string;
  platform: 'socialtoaster' | 'broadwaydirect';
  date: Date;
  status: 'pending' | 'submitted' | 'failed' | 'won' | 'lost';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Show {
  name: string;
  platform: 'socialtoaster' | 'broadwaydirect';
  url: string;
  genre?: string;
  active: boolean;
}

export interface UserOverride {
  userId: string;
  showName: string;
  platform: 'socialtoaster' | 'broadwaydirect';
  shouldApply: boolean; // true = apply, false = skip
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformCredentials {
  id: string;
  userId: string;
  platform: 'socialtoaster' | 'broadwaydirect';
  email: string;
  encryptedPassword: string; // Encrypted password
  createdAt: Date;
  updatedAt: Date;
}

export interface ShowWithPreference {
  show: Show;
  matchesPreference: boolean; // Based on AI parsing
  hasOverride: boolean;
  overrideShouldApply?: boolean; // User's manual override
  finalDecision: boolean; // Final decision after considering override
}

