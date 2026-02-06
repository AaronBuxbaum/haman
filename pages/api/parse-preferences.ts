import { NextApiRequest, NextApiResponse } from 'next';
import { PreferenceParser } from '../../src/preferenceParser';

/**
 * POST /api/parse-preferences
 * Parse user preferences using OpenAI
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'string') {
      return res.status(400).json({ error: 'preferences text is required' });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return res.status(200).json({ 
        parsedPreferences: null,
        message: 'No OpenAI API key configured. All shows will be excluded by default.'
      });
    }

    const parser = new PreferenceParser(openaiApiKey);
    const parsedPreferences = await parser.parsePreferences(preferences);

    return res.status(200).json({ parsedPreferences });
  } catch (error) {
    console.error('Error parsing preferences:', error);
    return res.status(500).json({ error: 'Failed to parse preferences' });
  }
}
