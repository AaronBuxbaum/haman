import { NextApiRequest, NextApiResponse } from 'next';
import { getActiveShows } from '../../src/showCatalog';
import { PreferenceParser } from '../../src/preferenceParser';
import { getAllUserOverrides } from '../../src/kvStorage';
import { ShowWithPreference } from '../../src/types';

/**
 * GET /api/shows
 * Get all shows with preference matching and user overrides
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, preferences } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const shows = await getActiveShows();
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Get all user overrides
    const userOverrides = await getAllUserOverrides(userId);
    const overrideMap = new Map(
      userOverrides.map(o => [`${o.platform}:${o.showName}`, o])
    );

    let showsWithPreferences: ShowWithPreference[];

    // If no OpenAI token, assume no shows should be requested (unless overridden)
    if (!openaiApiKey) {
      showsWithPreferences = shows.map(show => {
        const overrideKey = `${show.platform}:${show.name}`;
        const override = overrideMap.get(overrideKey);
        
        return {
          show,
          matchesPreference: false, // No OpenAI = no matches
          hasOverride: !!override,
          overrideShouldApply: override?.shouldApply,
          finalDecision: override?.shouldApply ?? false,
        };
      });
    } else if (preferences && typeof preferences === 'string') {
      // Parse preferences with OpenAI
      const parser = new PreferenceParser(openaiApiKey);
      const parsedPreferences = await parser.parsePreferences(preferences);

      showsWithPreferences = shows.map(show => {
        const matchesPreference = parser.matchesPreferences(show, parsedPreferences);
        const overrideKey = `${show.platform}:${show.name}`;
        const override = overrideMap.get(overrideKey);
        
        return {
          show,
          matchesPreference,
          hasOverride: !!override,
          overrideShouldApply: override?.shouldApply,
          finalDecision: override?.shouldApply ?? matchesPreference,
        };
      });
    } else {
      // No preferences provided, just show all with overrides
      showsWithPreferences = shows.map(show => {
        const overrideKey = `${show.platform}:${show.name}`;
        const override = overrideMap.get(overrideKey);
        
        return {
          show,
          matchesPreference: false,
          hasOverride: !!override,
          overrideShouldApply: override?.shouldApply,
          finalDecision: override?.shouldApply ?? false,
        };
      });
    }

    return res.status(200).json({ shows: showsWithPreferences });
  } catch (error) {
    console.error('Error fetching shows:', error);
    return res.status(500).json({ error: 'Failed to fetch shows' });
  }
}
