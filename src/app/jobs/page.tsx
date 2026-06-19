'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  fitScore: string;
  fitReason: string;
  status: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scraping, setScraping] = useState(false);
  const [search, setSearch] = useState('');
  const [filterScore, setFilterScore] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerScrape = async () => {
    setScraping(true);
    try {
      const res = await fetch('/api/jobs/scrape', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Scrape completed! Found ${data.newJobsCount} new target job opportunities.`);
        fetchJobs();
      } else {
        alert(`Scrape failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error running scraper: ${err.message}`);
    } finally {
      setScraping(false);
    }
  };

  const updateJobStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Error updating job:', err);
    }
  };

  // Filtering
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                          j.company.toLowerCase().includes(search.toLowerCase());
    const matchesScore = filterScore ? j.fitScore === filterScore : true;
    return matchesSearch && matchesScore && j.status === 'DISCOVERED';
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Find AI Internships & Freshers Roles</h1>
          <p className={styles.subtitle}>List of target AI jobs fetched automatically from startup Greenhouse & Lever boards.</p>
        </div>
        <button 
          onClick={triggerScrape} 
          disabled={scraping}
          className={`${styles.scrapeBtn} ${scraping ? styles.pulse : ''}`}
        >
          {scraping ? 'Scanning Board APIs...' : 'Scan For New Jobs'}
        </button>
      </header>

      {/* Scraper Details */}
      <div className={`${styles.statsBar} glass-panel`}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Source Boards</span>
          <span className={styles.statVal}>Greenhouse, Lever</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Auto Fetch</span>
          <span className={styles.statVal}>Every 3 Hours</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Jobs Awaiting Review</span>
          <span className={styles.statVal}>{filteredJobs.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`${styles.filterBar} glass-panel`}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by role title or company..."
          className={styles.searchInput}
        />
        <select
          value={filterScore}
          onChange={(e) => setFilterScore(e.target.value)}
          className={styles.scoreSelect}
        >
          <option value="">-- All Fit Scores --</option>
          <option value="A">Fit: A (Perfect)</option>
          <option value="B">Fit: B (Good)</option>
          <option value="C">Fit: C (Stretch)</option>
          <option value="F">Fit: F (Mismatch)</option>
        </select>
      </div>

      {/* Jobs Grid */}
      <div className={styles.jobsGrid}>
        {filteredJobs.map((job) => (
          <div key={job.id} className={`${styles.jobCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <span className={styles.companyName}>{job.company}</span>
              <span className={`${styles.fitBadge} ${styles[`fit_${job.fitScore}`]}`}>
                Fit Score: {job.fitScore}
              </span>
            </div>
            <h3 className={styles.jobTitle}>{job.title}</h3>
            <p className={styles.location}>📍 {job.location || 'Remote/Hybrid'}</p>
            <p className={styles.fitReason}>{job.fitReason}</p>

            <div className={styles.cardActions}>
              <a href={job.url} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                View Post &rarr;
              </a>
              <div className={styles.actionBtns}>
                <button
                  onClick={() => updateJobStatus(job.id, 'SKIPPED')}
                  className={styles.skipBtn}
                >
                  Skip
                </button>
                <button
                  onClick={() => updateJobStatus(job.id, 'APPLIED')}
                  className={styles.applyBtn}
                >
                  Applied
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className={styles.emptyState}>No discovered jobs match your filters. Click Scan For New Jobs to fetch.</div>
        )}
      </div>
    </div>
  );
}
