export interface User {
  id: string;
  email: string;
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
