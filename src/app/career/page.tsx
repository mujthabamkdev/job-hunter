'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function CareerPage() {
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/career');
      const data = await res.json();
      if (data.success) {
        setRoadmap(data.roadmap);
      }
    } catch (err) {
      console.error('Error fetching career roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Long-Term AI Career Planner</h1>
          <p className={styles.subtitle}>Receive AI-tailored career roadmap stages, study milestones, and architectural growth tracks.</p>
        </div>
        <button 
          onClick={fetchRoadmap} 
          disabled={loading}
          className={styles.refreshBtn}
        >
          {loading ? 'Re-Generating Roadmap...' : 'Refresh AI Roadmap'}
        </button>
      </header>

      {loading && (
        <div className={styles.loader}>
          <div className={styles.pulseSpinner}></div>
          <p>Analyzing your current skill list, aggregating industry requirements, and outlining your multi-stage engineering roadmap...</p>
        </div>
      )}

      {/* Roadmap Content */}
      {roadmap && !loading && (
        <div className={`${styles.roadmapCard} glass-panel`}>
          <div className={styles.badge}>ROADMAP SUMMARY</div>
          <div className={styles.markdownContent}>
            {roadmap}
          </div>
        </div>
      )}
    </div>
  );
}
