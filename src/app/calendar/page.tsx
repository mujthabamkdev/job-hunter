'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Interview {
  id: string;
  round: string;
  scheduledAt: string;
  notes: string;
  prepMaterial?: string;
  responseReview?: string;
  status: string;
  application: {
    id: string;
    job: {
      title: string;
      company: string;
    };
  };
}

interface Application {
  id: string;
  job: {
    title: string;
    company: string;
  };
}

export default function CalendarPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Schedule Form State
  const [appId, setAppId] = useState('');
  const [round, setRound] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Active Detail Modal State
  const [activeInterview, setActiveInterview] = useState<Interview | null>(null);
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false);

  const fetchInterviews = async () => {
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (data.success) {
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error('Error fetching interviews:', err);
    }
  };

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
    fetchInterviews();
    fetchApplications();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !round || !dateTime) return;
    setLoading(true);
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          round,
          scheduledAt: dateTime,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInterviews();
        setFormOpen(false);
        setAppId('');
        setRound('');
        setDateTime('');
        setNotes('');
      }
    } catch (err) {
      console.error('Error scheduling interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePrepPlan = async (id: string) => {
    setGeneratingPrep(true);
    try {
      const res = await fetch('/api/calendar/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInterviews();
        // Update active modal view with the new prep
        if (activeInterview && activeInterview.id === id) {
          setActiveInterview(data.interview);
        }
      }
    } catch (err) {
      console.error('Error generating prep:', err);
    } finally {
      setGeneratingPrep(false);
    }
  };

  const analyzeInterviewFeedback = async (id: string) => {
    if (!feedbackNotes) return;
    setAnalyzingFeedback(true);
    try {
      const res = await fetch('/api/calendar/prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId: id, notesFeedback: feedbackNotes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInterviews();
        if (activeInterview && activeInterview.id === id) {
          setActiveInterview(data.interview);
        }
        setFeedbackNotes('');
      }
    } catch (err) {
      console.error('Error analyzing feedback:', err);
    } finally {
      setAnalyzingFeedback(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Interview Calendar & Prep</h1>
          <p className={styles.subtitle}>Schedule upcoming loops and generate targeted AI technical study notes.</p>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className={styles.scheduleBtn}>
          {formOpen ? 'Close Panel' : 'Schedule Interview'}
        </button>
      </header>

      {/* Schedule Form */}
      {formOpen && (
        <form onSubmit={handleSchedule} className={`${styles.form} glass-panel`}>
          <h3>Add New Interview Loop</h3>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Select Application</label>
              <select value={appId} onChange={(e) => setAppId(e.target.value)} required>
                <option value="">-- Choose Company --</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.job.company} - {app.job.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Interview Round / Type</label>
              <input
                type="text"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
                placeholder="E.g., Tech Screen, ML System Design"
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Date & Time</label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Meeting Link / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Google Meet, Zoom Link, or notes..."
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={styles.saveFormBtn}>
            {loading ? 'Scheduling...' : 'Save Interview Slot'}
          </button>
        </form>
      )}

      {/* Interviews List */}
      <div className={styles.timelineList}>
        {interviews.map((int) => (
          <div key={int.id} className={`${styles.timelineItem} glass-panel`}>
            <div className={styles.itemHeader}>
              <div>
                <span className={styles.companyBadge}>{int.application.job.company}</span>
                <span className={styles.roundLabel}>{int.round}</span>
              </div>
              <span className={`${styles.statusLabel} ${styles[int.status.toLowerCase()]}`}>
                {int.status}
              </span>
            </div>
            
            <h3 className={styles.jobTitle}>{int.application.job.title}</h3>
            
            <div className={styles.itemMeta}>
              <p>⏰ {new Date(int.scheduledAt).toLocaleString()}</p>
              {int.notes && <p>🔗 {int.notes}</p>}
            </div>

            <div className={styles.itemFooter}>
              <button 
                onClick={() => {
                  setActiveInterview(int);
                }} 
                className={styles.prepBtn}
              >
                {int.prepMaterial ? 'Open Prep Materials' : 'Prepare for Interview'}
              </button>
            </div>
          </div>
        ))}

        {interviews.length === 0 && (
          <div className={styles.emptyState}>No interviews scheduled yet. Select a job application to start!</div>
        )}
      </div>

      {/* Interview Prep & Feedback Modal */}
      {activeInterview && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{activeInterview.application.job.company} - {activeInterview.round}</h2>
                <p className={styles.modalSub}>{activeInterview.application.job.title}</p>
              </div>
              <button onClick={() => setActiveInterview(null)} className={styles.closeModalBtn}>&times;</button>
            </div>

            <div className={styles.modalBody}>
              {/* Prep Materials Section */}
              <div className={styles.modalSection}>
                <h3>AI Technical Study Prep</h3>
                {activeInterview.prepMaterial ? (
                  <div className={styles.markdownRender}>{activeInterview.prepMaterial}</div>
                ) : (
                  <div className={styles.noPrepState}>
                    <p>No study guide has been generated for this interview round yet.</p>
                    <button 
                      onClick={() => generatePrepPlan(activeInterview.id)}
                      disabled={generatingPrep}
                      className={styles.generateBtn}
                    >
                      {generatingPrep ? 'Generating study notes...' : 'Generate AI Study Guide & Mock Qs'}
                    </button>
                  </div>
                )}
              </div>

              {/* Response Analysis / Post Interview Section */}
              <div className={styles.modalSection}>
                <h3>Post-Interview Response Analysis</h3>
                {activeInterview.responseReview ? (
                  <div className={styles.markdownRenderReview}>{activeInterview.responseReview}</div>
                ) : (
                  <div className={styles.feedbackForm}>
                    <label>How did it go? Paste your interview notes, questions asked, or transcripts:</label>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Write down what questions you struggled with, what they asked, or how you felt..."
                      className={styles.feedbackTextArea}
                    />
                    <button
                      onClick={() => analyzeInterviewFeedback(activeInterview.id)}
                      disabled={analyzingFeedback || !feedbackNotes}
                      className={styles.analyzeBtn}
                    >
                      {analyzingFeedback ? 'Analyzing responses...' : 'Submit & Analyze Performance'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
