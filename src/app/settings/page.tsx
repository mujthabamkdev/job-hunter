'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function SettingsPage() {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailPass, setGmailPass] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setOpenrouterKey(data.settings.OPENROUTER_API_KEY || '');
        setGeminiKey(data.settings.GEMINI_API_KEY || '');
        setGithubToken(data.settings.GITHUB_TOKEN || '');
        setGmailUser(data.settings.GMAIL_USER || '');
        setGmailPass(data.settings.GMAIL_PASS || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterKey,
          geminiKey,
          githubToken,
          gmailUser,
          gmailPass,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Settings saved successfully!');
        fetchSettings();
      } else {
        alert(`Error saving: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>System Settings & Configurations</h1>
        <p className={styles.subtitle}>Configure your AI models and database integrations directly from the web interface.</p>
      </header>

      <form onSubmit={handleSaveSettings} className={`${styles.form} glass-panel`}>
        <h3>AI Model Credentials</h3>
        
        <div className={styles.formGroup}>
          <label>OpenRouter API Key (Recommended for Free Tier Models)</label>
          <input
            type="password"
            value={openrouterKey}
            onChange={(e) => setOpenrouterKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
          <p className={styles.helperText}>Used to query free models like google/gemini-2.5-flash:free or meta-llama/llama-3-8b-instruct:free.</p>
        </div>

        <div className={styles.formGroup}>
          <label>Google Gemini API Key (Direct Fallback)</label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIzaSy..."
          />
          <p className={styles.helperText}>Used for direct Gemini API queries (up to 15 requests/minute free in Google AI Studio).</p>
        </div>

        <hr className={styles.divider} />
        
        <h3>GitHub Integrations</h3>
        
        <div className={styles.formGroup}>
          <label>GitHub Personal Access Token (for portfolio analysis)</label>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="ghp_..."
          />
          <p className={styles.helperText}>Allows reading repository data. Generate one under Settings {' > '} Developer Settings {' > '} Personal Access Tokens on GitHub.</p>
        </div>

        <hr className={styles.divider} />

        <h3>Gmail IMAP Sync Settings</h3>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Gmail Address</label>
            <input
              type="email"
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              placeholder="user@gmail.com"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Gmail App Password</label>
            <input
              type="password"
              value={gmailPass}
              onChange={(e) => setGmailPass(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx"
            />
          </div>
        </div>
        <p className={styles.helperText}>Required to automatically sync responses. Generate an App Password in your Google Account security panel under 'App Passwords'.</p>

        <button type="submit" disabled={loading} className={styles.saveBtn}>
          {loading ? 'Saving Settings...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
