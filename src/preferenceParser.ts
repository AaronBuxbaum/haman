import OpenAI from 'openai';
import { ParsedPreferences } from './types';

export class PreferenceParser {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Parse user's free-text preferences using ChatGPT
   */
  async parsePreferences(preferencesText: string): Promise<ParsedPreferences> {
    const systemPrompt = `You are a helpful assistant that parses user preferences for Broadway show lotteries.
Extract the following information from the user's text:
- genres: Array of genres they're interested in (musical, drama, comedy, etc.)
- showNames: Specific show names mentioned
- priceRange: Min and max price if mentioned
- dateRange: Date ranges if mentioned
- excludeShows: Shows they want to exclude
- keywords: Other relevant keywords

Return ONLY a valid JSON object with these fields. If a field is not mentioned, omit it.`;

    const userPrompt = `Parse this preference text: "${preferencesText}"`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const parsed = JSON.parse(content);
      return this.normalizePreferences(parsed);
    } catch (error) {
      console.error('Error parsing preferences:', error);
      throw new Error('Failed to parse preferences');
    }
  }

  /**
   * Normalize and validate the parsed preferences
   */
  private normalizePreferences(parsed: Record<string, unknown>): ParsedPreferences {
    const preferences: ParsedPreferences = {};

    if (parsed.genres && Array.isArray(parsed.genres)) {
      preferences.genres = parsed.genres.map((g: string) => g.toLowerCase());
    }

    if (parsed.showNames && Array.isArray(parsed.showNames)) {
      preferences.showNames = parsed.showNames;
    }

    if (parsed.priceRange && typeof parsed.priceRange === 'object') {
      const priceRange = parsed.priceRange as Record<string, number>;
      preferences.priceRange = {
        min: priceRange.min,
        max: priceRange.max
      };
    }

    if (parsed.dateRange && typeof parsed.dateRange === 'object') {
      const dateRange = parsed.dateRange as Record<string, string>;
      preferences.dateRange = {
        start: dateRange.start ? new Date(dateRange.start) : undefined,
        end: dateRange.end ? new Date(dateRange.end) : undefined
      };
    }

    if (parsed.excludeShows && Array.isArray(parsed.excludeShows)) {
      preferences.excludeShows = parsed.excludeShows;
    }

    if (parsed.keywords && Array.isArray(parsed.keywords)) {
      preferences.keywords = parsed.keywords.map((k: string) => k.toLowerCase());
    }

    return preferences;
  }

  /**
   * Check if a show matches user preferences
   */
  matchesPreferences(show: { name: string; genre?: string }, preferences: ParsedPreferences): boolean {
    // If specific shows are mentioned, only match those
    if (preferences.showNames && preferences.showNames.length > 0) {
      const showMatch = preferences.showNames.some(
        name => show.name.toLowerCase().includes(name.toLowerCase())
      );
      if (!showMatch) return false;
    }

    // Check if show is in exclude list
    if (preferences.excludeShows && preferences.excludeShows.length > 0) {
      const isExcluded = preferences.excludeShows.some(
        name => show.name.toLowerCase().includes(name.toLowerCase())
      );
      if (isExcluded) return false;
    }

    // Check genre match
    if (preferences.genres && preferences.genres.length > 0 && show.genre) {
      const genreMatch = preferences.genres.some(
        genre => show.genre?.toLowerCase().includes(genre)
      );
      if (!genreMatch) return false;
    }

    return true;
  }
}
