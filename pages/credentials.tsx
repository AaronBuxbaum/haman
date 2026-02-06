import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Credentials.module.css';

interface Credential {
  email: string;
  platform: 'socialtoaster' | 'broadwaydirect';
}

interface CredentialsByPlatform {
  socialtoaster: Credential[];
  broadwaydirect: Credential[];
}

export default function Credentials() {
  const router = useRouter();
  const [userId, setUserId] = useState('demo-user-1');
  const [credentials, setCredentials] = useState<CredentialsByPlatform>({
    socialtoaster: [],
    broadwaydirect: [],
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCredential, setNewCredential] = useState({
    platform: 'socialtoaster' as 'socialtoaster' | 'broadwaydirect',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCredentials();
  }, [userId]);

  const loadCredentials = async () => {
    try {
      const response = await fetch(`/api/credentials?userId=${userId}`);
      const data = await response.json();
      if (data.credentials) {
        setCredentials(data.credentials);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      setMessage('Failed to load credentials');
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/credentials?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCredential),
      });

      if (response.ok) {
        setMessage('Credential added successfully');
        setNewCredential({ platform: 'socialtoaster', email: '', password: '' });
        setShowAddForm(false);
        await loadCredentials();
      } else {
        setMessage('Failed to add credential');
      }
    } catch (error) {
      console.error('Error adding credential:', error);
      setMessage('Failed to add credential');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (platform: string, email: string) => {
    if (!confirm(`Delete credential for ${email} on ${platform}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/credentials?userId=${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, email }),
      });

      if (response.ok) {
        setMessage('Credential deleted successfully');
        await loadCredentials();
      } else {
        setMessage('Failed to delete credential');
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      setMessage('Failed to delete credential');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Platform Credentials</h1>
        <p>Manage your login credentials for lottery platforms</p>
        <button onClick={() => router.push('/')} className={styles.backButton}>
          ← Back to Dashboard
        </button>
      </header>

      <div className={styles.infoBox}>
        <p>
          <strong>Security Note:</strong> Passwords are encrypted before storage. You can add
          multiple accounts per platform to apply to multiple lotteries for the same show.
        </p>
      </div>

      <div className={styles.controls}>
        <label htmlFor="userId">User ID:</label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={styles.input}
        />

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addButton}
        >
          {showAddForm ? '✕ Cancel' : '+ Add Credential'}
        </button>

        {message && <div className={styles.message}>{message}</div>}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCredential} className={styles.addForm}>
          <h3>Add New Credential</h3>
          
          <label htmlFor="platform">Platform:</label>
          <select
            id="platform"
            value={newCredential.platform}
            onChange={(e) =>
              setNewCredential({
                ...newCredential,
                platform: e.target.value as 'socialtoaster' | 'broadwaydirect',
              })
            }
            className={styles.select}
          >
            <option value="socialtoaster">SocialToaster / LuckySeat</option>
            <option value="broadwaydirect">BroadwayDirect</option>
          </select>

          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={newCredential.email}
            onChange={(e) =>
              setNewCredential({ ...newCredential, email: e.target.value })
            }
            required
            className={styles.input}
          />

          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={newCredential.password}
            onChange={(e) =>
              setNewCredential({ ...newCredential, password: e.target.value })
            }
            required
            className={styles.input}
          />

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Adding...' : 'Add Credential'}
          </button>
        </form>
      )}

      <div className={styles.credentialsSection}>
        <h2>SocialToaster / LuckySeat Credentials</h2>
        {credentials.socialtoaster.length === 0 ? (
          <p className={styles.emptyMessage}>No credentials added yet</p>
        ) : (
          <div className={styles.credentialsList}>
            {credentials.socialtoaster.map((cred, index) => (
              <div key={index} className={styles.credentialCard}>
                <div className={styles.credentialInfo}>
                  <span className={styles.email}>{cred.email}</span>
                  <span className={styles.platform}>socialtoaster</span>
                </div>
                <button
                  onClick={() => handleDeleteCredential(cred.platform, cred.email)}
                  className={styles.deleteButton}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <h2>BroadwayDirect Credentials</h2>
        {credentials.broadwaydirect.length === 0 ? (
          <p className={styles.emptyMessage}>No credentials added yet</p>
        ) : (
          <div className={styles.credentialsList}>
            {credentials.broadwaydirect.map((cred, index) => (
              <div key={index} className={styles.credentialCard}>
                <div className={styles.credentialInfo}>
                  <span className={styles.email}>{cred.email}</span>
                  <span className={styles.platform}>broadwaydirect</span>
                </div>
                <button
                  onClick={() => handleDeleteCredential(cred.platform, cred.email)}
                  className={styles.deleteButton}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
