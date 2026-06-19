'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  skills: string;
  targetRoles: string;
  experience: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    bio: '',
    skills: '',
    targetRoles: '',
    experience: '',
  });
  const [saving, setSaving] = useState(false);
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        alert('Profile saved successfully! All other modules will sync with these details.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setFile(null);
        alert('Resume parsed and profile updated automatically!');
      } else {
        alert(`Parsing Failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Upload Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Candidate Profile</h1>
        <p className={styles.subtitle}>Define your background details, target roles, and core skills. AI uses this data across all other features.</p>
      </header>

      {/* Resume Uploader Card */}
      <div className={`${styles.uploaderCard} glass-panel`}>
        <div className={styles.uploaderHeader}>
          <h3>Auto-Populate Profile</h3>
          <span className={styles.sparkBadge}>AI Parser</span>
        </div>
        <p className={styles.uploaderSub}>Upload your existing resume in PDF or TXT format. The AI agent will parse and auto-populate all profile fields for you.</p>
        
        <form onSubmit={handleUploadResume} className={styles.uploadForm}>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="resume-file"
          />
          <label htmlFor="resume-file" className={styles.fileLabel}>
            {file ? `Selected: ${file.name}` : 'Choose PDF or TXT Resume'}
          </label>
          <button 
            type="submit" 
            disabled={uploading || !file} 
            className={styles.uploadBtn}
          >
            {uploading ? 'Parsing Resume...' : 'Parse & Import'}
          </button>
        </form>

        {uploading && (
          <div className={styles.uploadLoader}>
            <div className={styles.uploadSpinner}></div>
            <p>AI is scanning document elements, identifying sections, and extracting your skills and work history...</p>
          </div>
        )}
      </div>

      <form onSubmit={saveProfile} className={`${styles.form} glass-panel`}>
        <h3>Candidate Details</h3>
        
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              required
              placeholder="E.g., Mujthaba"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
              placeholder="E.g., Mujthaba@domain.com"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={profile.phone || ''}
              onChange={handleProfileChange}
              placeholder="E.g., +1 234 567 890"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Target Role Titles</label>
            <input
              type="text"
              name="targetRoles"
              value={profile.targetRoles}
              onChange={handleProfileChange}
              placeholder="AI Intern, Machine Learning Intern (comma separated)"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Professional Bio / Summary</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleProfileChange}
            rows={3}
            placeholder="Introduce yourself. Outline your background and goals."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Core Skills (Comma Separated)</label>
          <input
            type="text"
            name="skills"
            value={profile.skills}
            onChange={handleProfileChange}
            placeholder="Python, PyTorch, Scikit-learn, Docker, Git, LLM fine-tuning..."
          />
        </div>

        <div className={styles.formGroup}>
          <label>Detailed Experience & Projects (Markdown/Text list)</label>
          <textarea
            name="experience"
            value={profile.experience || ''}
            onChange={handleProfileChange}
            rows={10}
            placeholder="Describe your education, past jobs, and projects. Provide rich details so that AI can write highly targeted resumes and cover letters for specific jobs."
          />
        </div>

        <button type="submit" disabled={saving} className={styles.saveBtn}>
          {saving ? 'Saving Profile...' : 'Save Profile Details'}
        </button>
      </form>
    </div>
  );
}
