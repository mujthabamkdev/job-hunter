'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Repo {
  name: string;
  description: string;
  language: string;
  stars: number;
  url: string;
}

interface RecommendedProject {
  name: string;
  description: string;
  difficulty: string;
  stack: string;
  milestones: string;
}

interface Analysis {
  techStackOverview: string;
  skillGaps: string;
  repoImprovements: string;
  recommendedProject: RecommendedProject;
}

export default function ProjectsPage() {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Load existing recommendations from local DB on load
  const loadSavedRecommendations = async () => {
    try {
      const res = await fetch('/api/profile');
      const profileData = await res.json();
      
      const projectRes = await fetch('/api/jobs'); // Reuse database fetch or separate query
      // For this prototype, we query the project endpoint directly:
      const pRes = await fetch('/api/profile'); // Fetch projects from db
    } catch (err) {}
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setAnalysis(null);
    setRepos([]);
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token }),
      });
      const data = await res.json();
      if (data.success) {
        setRepos(data.repos);
        setAnalysis(data.analysis);
      } else {
        alert(`Error analyzing: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>GitHub Project Portfolio Analyzer</h1>
        <p className={styles.subtitle}>Connect your GitHub to identify AI/ML skill gaps and receive recommendations for high-impact projects.</p>
      </header>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className={`${styles.form} glass-panel`}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>GitHub Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="E.g., octocat"
            />
          </div>
          <div className={styles.formGroup}>
            <label>GitHub Personal Token (Optional, for private repos)</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token..."
            />
          </div>
          <button type="submit" disabled={loading} className={styles.analyzeBtn}>
            {loading ? 'Analyzing Portfolio...' : 'Analyze GitHub'}
          </button>
        </div>
      </form>

      {/* Loading State */}
      {loading && (
        <div className={styles.loader}>
          <div className={styles.pulseSpinner}></div>
          <p>Scraping repository details, analyzing code tags, and matching your stack to recruiter expectations...</p>
        </div>
      )}

      {analysis && (
        <div className={styles.resultsContainer}>
          {/* Main Feedback Grid */}
          <div className={styles.grid}>
            {/* Tech Stack & Gaps */}
            <div className={`${styles.card} glass-panel`}>
              <h3>Tech Stack & Skill Gaps</h3>
              <div className={styles.section}>
                <h4>Current Stack Overview</h4>
                <p>{analysis.techStackOverview}</p>
              </div>
              <div className={styles.section}>
                <h4>AI/ML Skill Gaps Identified</h4>
                <p className={styles.skillGaps}>{analysis.skillGaps}</p>
              </div>
            </div>

            {/* Existing Repo Improvements */}
            <div className={`${styles.card} glass-panel`}>
              <h3>Repository Optimization Tips</h3>
              <p className={styles.subtitleSmall}>Make your current repositories look professional for tech leads.</p>
              <div className={styles.markdownContent}>{analysis.repoImprovements}</div>
            </div>
          </div>

          {/* Recommended New Project */}
          <div className={`${styles.recommendedCard} glass-panel`}>
            <div className={styles.badge}>RECOMMENDED AI PORTFOLIO PROJECT</div>
            <h2 className={styles.projName}>{analysis.recommendedProject.name}</h2>
            <p className={styles.projDesc}>{analysis.recommendedProject.description}</p>
            
            <div className={styles.projMeta}>
              <div>
                <strong>DIFFICULTY:</strong>{' '}
                <span className={`${styles.diffBadge} ${styles[analysis.recommendedProject.difficulty.toLowerCase()]}`}>
                  {analysis.recommendedProject.difficulty}
                </span>
              </div>
              <div>
                <strong>TECH STACK:</strong> {analysis.recommendedProject.stack}
              </div>
            </div>

            <div className={styles.milestonesSection}>
              <h4>Step-by-Step Implementation Milestones</h4>
              <div className={styles.milestonesList}>
                {analysis.recommendedProject.milestones && typeof analysis.recommendedProject.milestones === 'string' ? (
                  <p>{analysis.recommendedProject.milestones}</p>
                ) : Array.isArray(analysis.recommendedProject.milestones) ? (
                  (analysis.recommendedProject.milestones as string[]).map((step: string, idx: number) => (
                    <div key={idx} className={styles.milestoneStep}>
                      <span className={styles.stepNum}>{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>

          {/* Repository List */}
          <div className={`${styles.reposCard} glass-panel`}>
            <h3>Analyzed Repositories ({repos.length})</h3>
            <div className={styles.reposList}>
              {repos.map((repo) => (
                <div key={repo.name} className={styles.repoItem}>
                  <div className={styles.repoHeader}>
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className={styles.repoLink}>
                      {repo.name}
                    </a>
                    <span className={styles.repoLang}>{repo.language}</span>
                  </div>
                  <p className={styles.repoDesc}>{repo.description}</p>
                  <div className={styles.repoFooter}>
                    <span>⭐ {repo.stars} stars</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
