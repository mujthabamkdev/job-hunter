'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Application {
  id: string;
  status: string;
  job: {
    title: string;
    company: string;
  };
  tailoredCoverLetter?: string;
}

export default function ResumePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [tailoringAppId, setTailoringAppId] = useState('');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredResult, setTailoredResult] = useState<{
    coverLetter: string;
    resumeSuggestions: string;
  } | null>(null);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleTailorDocs = async () => {
    if (!tailoringAppId) return;
    setTailoring(true);
    setTailoredResult(null);
    try {
      const res = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: tailoringAppId }),
      });
      const data = await res.json();
      if (data.success) {
        setTailoredResult({
          coverLetter: data.coverLetter,
          resumeSuggestions: data.resumeSuggestions,
        });
        fetchApplications();
      } else {
        alert(`Error tailoring: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setTailoring(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Resume & Cover Letter Customizer</h1>
        <p className={styles.subtitle}>Select a job listing to automatically adjust your CV skills and draft a highly-targeted Cover Letter using AI.</p>
      </header>

      <div className={styles.tailorContainer}>
        {/* Scraper Selector */}
        <div className={`${styles.tailorControl} glass-panel`}>
          <h3 className={styles.tailorHeading}>One-Click ATS Tailoring</h3>
          <p className={styles.tailorSub}>Cross-references your base profile skills and experience against the selected job details.</p>
          
          <div className={styles.tailorSelectGroup}>
            <select
              value={tailoringAppId}
              onChange={(e) => setTailoringAppId(e.target.value)}
              className={styles.tailorSelect}
            >
              <option value="">-- Choose an active job application --</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.job.company} - {app.job.title} ({app.status})
                </option>
              ))}
            </select>
            
            <button
              onClick={handleTailorDocs}
              disabled={tailoring || !tailoringAppId}
              className={styles.tailorBtn}
            >
              {tailoring ? 'Tailoring Documents...' : 'Tailor CV & Cover Letter'}
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {tailoring && (
          <div className={styles.loader}>
            <div className={styles.pulseSpinner}></div>
            <p>AI is analyzing the job description, cross-referencing your profile, injecting target keywords, and generating your Cover Letter...</p>
          </div>
        )}

        {/* Results Display */}
        {tailoredResult && (
          <div className={styles.resultsGrid}>
            {/* Cover Letter */}
            <div className={`${styles.resultCard} glass-panel`}>
              <div className={styles.resultHeader}>
                <h4>Tailored Cover Letter</h4>
                <button
                  onClick={() => copyToClipboard(tailoredResult.coverLetter)}
                  className={styles.copyBtn}
                >
                  Copy Text
                </button>
              </div>
              <div className={styles.letterContent}>{tailoredResult.coverLetter}</div>
            </div>

            {/* Resume suggestions */}
            <div className={`${styles.resultCard} glass-panel`}>
              <div className={styles.resultHeader}>
                <h4>CV Optimization Suggestions</h4>
                <button
                  onClick={() => copyToClipboard(tailoredResult.resumeSuggestions)}
                  className={styles.copyBtn}
                >
                  Copy Suggestions
                </button>
              </div>
              <div className={styles.suggestionsContent}>{tailoredResult.resumeSuggestions}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
