import { useState, useEffect } from 'react';
import type { ShowWithPreference } from '../src/types';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const [userId, setUserId] = useState('demo-user-1');
  const [preferences, setPreferences] = useState('');
  const [shows, setShows] = useState<ShowWithPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasOpenAI, setHasOpenAI] = useState(true);

  // Load shows on mount
  useEffect(() => {
    loadShows();
  }, [userId]);

  const loadShows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId });
      if (preferences) {
        params.append('preferences', preferences);
      }
      
      const response = await fetch(`/api/shows?${params}`);
      const data = await response.json();
      
      if (data.shows) {
        setShows(data.shows);
      }
      
      // Check if OpenAI is available by looking at the first show
      if (data.shows && data.shows.length > 0) {
        const hasMatches = data.shows.some((s: ShowWithPreference) => s.matchesPreference);
        if (!hasMatches && !preferences) {
          setHasOpenAI(false);
        }
      }
    } catch (error) {
      console.error('Error loading shows:', error);
      setMessage('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshShows = async () => {
    setLoading(true);
    setMessage('Refreshing shows from platforms...');
    try {
      const response = await fetch('/api/refresh-shows', { method: 'POST' });
      const data = await response.json();
      setMessage(data.message || 'Shows refreshed');
      await loadShows();
    } catch (error) {
      console.error('Error refreshing shows:', error);
      setMessage('Failed to refresh shows');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPreferences = async () => {
    if (!preferences) {
      setMessage('Please enter your preferences first');
      return;
    }
    
    setLoading(true);
    setMessage('Parsing preferences with OpenAI...');
    try {
      const response = await fetch('/api/parse-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      const data = await response.json();
      
      if (data.parsedPreferences) {
        setMessage('Preferences parsed successfully');
        await loadShows();
      } else if (data.message) {
        setMessage(data.message);
        setHasOpenAI(false);
      }
    } catch (error) {
      console.error('Error parsing preferences:', error);
      setMessage('Failed to parse preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOverride = async (show: ShowWithPreference) => {
    try {
      const newValue = !show.finalDecision;
      
      const response = await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          showName: show.show.name,
          platform: show.show.platform,
          shouldApply: newValue,
        }),
      });
      
      if (response.ok) {
        await loadShows();
        setMessage(`Override set for ${show.show.name}`);
      }
    } catch (error) {
      console.error('Error setting override:', error);
      setMessage('Failed to set override');
    }
  };

  const handleApplyLotteries = async () => {
    setLoading(true);
    setMessage('Applying to lotteries...');
    try {
      const response = await fetch('/api/apply-lotteries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: `${userId}@example.com`,
          preferences,
          firstName: 'Demo',
          lastName: 'User',
        }),
      });
      
      const data = await response.json();
      setMessage(data.message || 'Applications submitted');
    } catch (error) {
      console.error('Error applying to lotteries:', error);
      setMessage('Failed to apply to lotteries');
    } finally {
      setLoading(false);
    }
  };

  const getShowIcon = (show: ShowWithPreference) => {
    if (show.finalDecision) {
      return <span className={styles.checkmark}>✓</span>;
    }
    return <span className={styles.cross}>✗</span>;
  };

  const getStatusText = (show: ShowWithPreference) => {
    if (show.hasOverride) {
      return show.overrideShouldApply ? 'Manually Enabled' : 'Manually Disabled';
    }
    if (!hasOpenAI) {
      return 'No OpenAI - Disabled by default';
    }
    return show.matchesPreference ? 'Matches Preferences' : 'Does Not Match';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Broadway Lottery Dashboard</h1>
        <p>Manage your show preferences and lottery applications</p>
      </header>

      {!hasOpenAI && (
        <div className={styles.warning}>
          ⚠️ No OpenAI API key configured. All shows are disabled by default unless manually overridden.
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.preferencesSection}>
          <label htmlFor="userId">User ID:</label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className={styles.input}
          />
          
          <label htmlFor="preferences">Your Preferences:</label>
          <textarea
            id="preferences"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g., I love musicals, especially Hamilton and Wicked..."
            rows={4}
            className={styles.textarea}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={handleRefreshShows}
            disabled={loading}
            className={styles.button}
          >
            🔄 Refresh Shows
          </button>
          <button
            onClick={handleRefreshPreferences}
            disabled={loading || !preferences}
            className={styles.button}
          >
            🤖 Parse Preferences
          </button>
          <button
            onClick={handleApplyLotteries}
            disabled={loading}
            className={`${styles.button} ${styles.primaryButton}`}
          >
            🎭 Apply to Lotteries
          </button>
        </div>

        {message && (
          <div className={styles.message}>
            {message}
          </div>
        )}
      </div>

      <div className={styles.showsSection}>
        <h2>Available Shows ({shows.length})</h2>
        
        {loading && <div className={styles.loader}>Loading...</div>}
        
        <div className={styles.showsList}>
          {shows.map((showWithPref) => (
            <div key={`${showWithPref.show.platform}-${showWithPref.show.name}`} className={styles.showCard}>
              <div className={styles.showInfo}>
                <div className={styles.showHeader}>
                  {getShowIcon(showWithPref)}
                  <h3>{showWithPref.show.name}</h3>
                </div>
                <div className={styles.showMeta}>
                  <span className={styles.platform}>{showWithPref.show.platform}</span>
                  {showWithPref.show.genre && (
                    <span className={styles.genre}>{showWithPref.show.genre}</span>
                  )}
                </div>
                <div className={styles.status}>
                  Status: {getStatusText(showWithPref)}
                </div>
              </div>
              
              <div className={styles.showActions}>
                <button
                  onClick={() => handleToggleOverride(showWithPref)}
                  className={`${styles.overrideButton} ${
                    showWithPref.finalDecision ? styles.enabled : styles.disabled
                  }`}
                  title={showWithPref.finalDecision ? 'Click to disable' : 'Click to enable'}
                >
                  {showWithPref.finalDecision ? '✓ Enabled' : '✗ Disabled'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
