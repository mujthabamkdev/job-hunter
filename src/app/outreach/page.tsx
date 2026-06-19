'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface Contact {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  linkedinUrl: string;
  status: string;
  outreachLog: string;
}

export default function OutreachPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/outreach');
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company) return;
    setLoading(true);
    try {
      const res = await fetch('/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, title, linkedinUrl }),
      });
      const data = await res.json();
      if (data.success) {
        fetchContacts();
        setName('');
        setCompany('');
        setTitle('');
        setLinkedinUrl('');
        setFormOpen(false);
      }
    } catch (err) {
      console.error('Error adding contact:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/outreach', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchContacts();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Analytics Math
  const totalMessaged = contacts.filter((c) => c.status !== 'NOT_CONTACTED').length;
  const totalResponded = contacts.filter((c) => c.status === 'RESPONDED').length;
  const responseRate = totalMessaged > 0 ? Math.round((totalResponded / totalMessaged) * 100) : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>LinkedIn Recruiter Outreach</h1>
          <p className={styles.subtitle}>Draft personalized recruiter connection pitches and track outreach statistics.</p>
        </div>
        <button onClick={() => setFormOpen(!formOpen)} className={styles.addBtn}>
          {formOpen ? 'Close Panel' : 'Add Recruiter Contact'}
        </button>
      </header>

      {/* Analytics widgets */}
      <div className={styles.analyticsGrid}>
        <div className={`${styles.analyticCard} glass-panel`}>
          <p className={styles.analyticTitle}>Total Contacts Tracked</p>
          <h2 className={styles.analyticValue}>{contacts.length}</h2>
        </div>
        <div className={`${styles.analyticCard} glass-panel`}>
          <p className={styles.analyticTitle}>Recruiters Messaged</p>
          <h2 className={`${styles.analyticValue} glow-text-indigo`}>{totalMessaged}</h2>
        </div>
        <div className={`${styles.analyticCard} glass-panel`}>
          <p className={styles.analyticTitle}>Outreach Response Rate</p>
          <h2 className={`${styles.analyticValue} glow-text-cyan`}>{responseRate}%</h2>
          <p className={styles.analyticSub}>{totalResponded} responded</p>
        </div>
      </div>

      {/* Add Recruiter Form */}
      {formOpen && (
        <form onSubmit={handleAddContact} className={`${styles.form} glass-panel`}>
          <h3>Track New Recruiter Contact</h3>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Recruiter Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="E.g., Jane Doe"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                placeholder="E.g., OpenAI"
              />
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Title / Role</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Technical Recruiter, Director of Talent"
              />
            </div>
            <div className={styles.formGroup}>
              <label>LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className={styles.saveFormBtn}>
            {loading ? 'Generating AI Pitch...' : 'Save Recruiter & Generate Note'}
          </button>
        </form>
      )}

      {/* Contacts List */}
      <div className={`${styles.tableCard} glass-panel`}>
        <h3>Outreach Tracker</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Recruiter</th>
                <th>Company</th>
                <th>Title</th>
                <th>LinkedIn URL</th>
                <th>Personalized connection note (AI-Drafted)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td><strong>{contact.name}</strong></td>
                  <td>{contact.company}</td>
                  <td>{contact.title || 'N/A'}</td>
                  <td>
                    {contact.linkedinUrl ? (
                      <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        Visit Profile
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <div className={styles.pitchWrapper}>
                      <p className={styles.pitchText}>{contact.outreachLog || 'Add company/title to draft note.'}</p>
                      {contact.outreachLog && (
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(contact.outreachLog);
                            alert('Pitch note copied!');
                          }}
                          className={styles.copyBtn}
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={contact.status}
                      onChange={(e) => updateStatus(contact.id, e.target.value)}
                      className={`${styles.statusSelect} ${styles[contact.status.toLowerCase()]}`}
                    >
                      <option value="NOT_CONTACTED">Not Contacted</option>
                      <option value="MESSAGED">Messaged</option>
                      <option value="RESPONDED">Responded</option>
                      <option value="REJECTED">Declined</option>
                    </select>
                  </td>
                </tr>
              ))}

              {contacts.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyTable}>No contacts saved yet. Click Add Recruiter Contact above to start.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Playwright Local Automator Code Snippet */}
      <div className={`${styles.automatorCard} glass-panel`}>
        <div className={styles.badge}>LOCAL AUTOMATION AGENT</div>
        <h3>Run Playwright Outreach Locally (100% Free & Safe)</h3>
        <p className={styles.automatorSub}>To safely bypass LinkedIn bot limits and avoid bans, copy this local script to automate messages on your Mac terminal:</p>
        
        <pre className={styles.codeBlock}>
{`// Save this locally as "outreach.js" in your workspace
// Install Playwright: npm install playwright
// Run: node outreach.js "https://linkedin.com/in/recruiter-profile" "Your personalized connection note here"

const { chromium } = require('playwright');

(async () => {
  // Launch in headed mode so you can login or reuse your session
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to LinkedIn
  await page.goto('https://www.linkedin.com/login');
  console.log('Please log in to LinkedIn on the browser window, then press Enter in terminal...');
  
  process.stdin.once('data', async () => {
    // Navigate to targeted profile
    await page.goto(process.argv[2]);
    await page.waitForTimeout(3000);

    // Automate clicking "Connect" and pasting the message
    try {
      const connectBtn = page.locator('button:has-text("Connect")').first();
      await connectBtn.click();
      await page.waitForTimeout(1000);

      // Add a note
      const addNoteBtn = page.locator('button:has-text("Add a note")');
      await addNoteBtn.click();
      await page.waitForTimeout(1000);

      // Fill message
      await page.fill('textarea[name="message"]', process.argv[3]);
      console.log('Filled note. Review and click Send in your browser!');
    } catch (e) {
      console.error('Could not find connect button. Make sure you are logged in and looking at the profile.');
    }
  });
})();`}
        </pre>
      </div>
    </div>
  );
}
