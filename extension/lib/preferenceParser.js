/**
 * Preference parser using OpenAI API
 * Converts free-text user preferences into structured data for matching shows
 */

/**
 * Parse user's free-text preferences using OpenAI GPT-4
 */
async function parsePreferences(preferencesText, apiKey) {
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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    return normalizePreferences(parsed);
  } catch (error) {
    console.error('Error parsing preferences:', error);
    throw error;
  }
}

/**
 * Normalize and validate the parsed preferences
 */
function normalizePreferences(parsed) {
  const preferences = {};

  if (parsed.genres && Array.isArray(parsed.genres)) {
    preferences.genres = parsed.genres.map((g) => g.toLowerCase());
  }

  if (parsed.showNames && Array.isArray(parsed.showNames)) {
    preferences.showNames = parsed.showNames;
  }

  if (parsed.priceRange && typeof parsed.priceRange === 'object') {
    preferences.priceRange = {
      min: parsed.priceRange.min,
      max: parsed.priceRange.max,
    };
  }

  if (parsed.dateRange && typeof parsed.dateRange === 'object') {
    preferences.dateRange = {
      start: parsed.dateRange.start,
      end: parsed.dateRange.end,
    };
  }

  if (parsed.excludeShows && Array.isArray(parsed.excludeShows)) {
    preferences.excludeShows = parsed.excludeShows;
  }

  if (parsed.keywords && Array.isArray(parsed.keywords)) {
    preferences.keywords = parsed.keywords.map((k) => k.toLowerCase());
  }

  return preferences;
}

/**
 * Check if a show matches user preferences
 */
function matchesPreferences(show, preferences) {
  // If specific shows are mentioned, only match those
  if (preferences.showNames && preferences.showNames.length > 0) {
    const showMatch = preferences.showNames.some((name) =>
      show.name.toLowerCase().includes(name.toLowerCase())
    );
    if (!showMatch) return false;
  }

  // Check if show is in exclude list
  if (preferences.excludeShows && preferences.excludeShows.length > 0) {
    const isExcluded = preferences.excludeShows.some((name) =>
      show.name.toLowerCase().includes(name.toLowerCase())
    );
    if (isExcluded) return false;
  }

  // Check genre match
  if (preferences.genres && preferences.genres.length > 0 && show.genre) {
    const genreMatch = preferences.genres.some((genre) =>
      show.genre.toLowerCase().includes(genre)
    );
    if (!genreMatch) return false;
  }

  return true;
}
