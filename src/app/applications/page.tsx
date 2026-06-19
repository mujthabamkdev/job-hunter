'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  fitScore: string;
}

interface Application {
  id: string;
  status: string;
  notes: string;
  dateApplied: string;
  job: Job;
}

const COLUMNS = [
  { id: 'WISHLIST', name: 'Wishlist', color: 'cyan' },
  { id: 'APPLIED', name: 'Applied', color: 'indigo' },
  { id: 'INTERVIEWING', name: 'Interviewing', color: 'emerald' },
  { id: 'OFFERED', name: 'Offered', color: 'cyan' },
  { id: 'REJECTED', name: 'Rejected', color: 'rose' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appNotes, setAppNotes] = useState('');

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

  const moveApplication = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchApplications();
      }
    } catch (err) {
      console.error('Error moving application:', err);
    }
  };

  const handleSyncGmail = async () => {
    setSyncing(true);
    setSyncLogs(['Connecting to Gmail IMAP server...', 'Scanning inbox for keywords from target companies...']);
    setShowLogs(true);
    try {
      const res = await fetch('/api/gmail/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncLogs((prev) => [
          ...prev,
          ...data.logs,
          `Sync complete! Updated ${data.updatedCount} applications.`,
        ]);
        fetchApplications();
      } else {
        setSyncLogs((prev) => [...prev, `Sync Failed: ${data.error}`]);
      }
    } catch (err: any) {
      setSyncLogs((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setSyncing(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedApp.id, notes: appNotes }),
      });
      const data = await res.json();
      if (data.success) {
        fetchApplications();
        setSelectedApp(null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const openAppDetails = (app: Application) => {
    setSelectedApp(app);
    setAppNotes(app.notes || '');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Job Applications Tracking</h1>
          <p className={styles.subtitle}>Track your application status and sync recruiter response emails.</p>
        </div>
        <button 
          onClick={handleSyncGmail} 
          disabled={syncing}
          className={`${styles.syncButton} ${syncing ? styles.pulse : ''}`}
        >
          {syncing ? (
            <>
              <span className={styles.spinner}></span> Syncing Gmail...
            </>
          ) : (
            'Sync Recruiter Emails'
          )}
        </button>
      </header>

      {/* Sync Logs Display */}
      {showLogs && (
        <div className={styles.logsConsole}>
          <div className={styles.consoleHeader}>
            <span>Gmail Sync Console Logs</span>
            <button onClick={() => setShowLogs(false)} className={styles.closeConsoleBtn}>Close</button>
          </div>
          <div className={styles.logsList}>
            {syncLogs.map((log, index) => (
              <p key={index} className={styles.logLine}>{`> ${log}`}</p>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className={styles.kanbanBoard}>
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col.id);
          return (
            <div key={col.id} className={styles.kanbanColumn}>
              <div className={`${styles.columnHeader} ${styles[col.color]}`}>
                <h3 className={styles.columnName}>{col.name}</h3>
                <span className={styles.columnCount}>{colApps.length}</span>
              </div>

              <div className={styles.cardsContainer}>
                {colApps.map((app) => (
                  <div key={app.id} className={`${styles.jobCard} glass-panel`}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardCompany}>{app.job.company}</span>
                      <span className={`${styles.fitBadge} ${styles[`fit_${app.job.fitScore}`]}`}>
                        Fit: {app.job.fitScore}
                      </span>
                    </div>
                    <h4 className={styles.cardTitle}>{app.job.title}</h4>
                    <p className={styles.cardLocation}>{app.job.location}</p>
                    
                    {app.dateApplied && (
                      <p className={styles.cardDate}>
                        Applied: {new Date(app.dateApplied).toLocaleDateString()}
                      </p>
                    )}

                    {/* Card Actions */}
                    <div className={styles.cardActions}>
                      <button 
                        onClick={() => openAppDetails(app)} 
                        className={styles.detailsBtn}
                        title="View & Edit Notes"
                      >
                        Notes
                      </button>
                      <div className={styles.moveButtons}>
                        {col.id !== 'WISHLIST' && (
                          <button 
                            onClick={() => {
                              const prevIdx = COLUMNS.findIndex((c) => c.id === col.id) - 1;
                              moveApplication(app.id, COLUMNS[prevIdx].id);
                            }}
                            className={styles.moveBtn}
                            title="Move Left"
                          >
                            &larr;
                          </button>
                        )}
                        {col.id !== 'REJECTED' && (
                          <button 
                            onClick={() => {
                              const nextIdx = COLUMNS.findIndex((c) => c.id === col.id) + 1;
                              moveApplication(app.id, COLUMNS[nextIdx].id);
                            }}
                            className={styles.moveBtn}
                            title="Move Right"
                          >
                            &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className={styles.emptyColumnState}>No jobs in {col.name}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details & Notes Modal */}
      {selectedApp && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel`}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{selectedApp.job.title}</h2>
                <p className={styles.modalSub}>{selectedApp.job.company} - {selectedApp.job.location}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className={styles.closeModalBtn}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <label className={styles.notesLabel}>Job Application Notes & Response Logs</label>
              <textarea 
                value={appNotes}
                onChange={(e) => setAppNotes(e.target.value)}
                placeholder="Log interviews, write down recruiter contact info, or paste emails here..."
                className={styles.notesTextArea}
              />
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => setSelectedApp(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={saveNotes} className={styles.saveBtn}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
