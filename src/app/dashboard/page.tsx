'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface DashboardStats {
  jobsFound: number;
  resumesTailored: number;
  interviewsScheduled: number;
  contactsTotal: number;
}

interface RecentJob {
  id: string;
  title: string;
  company: string;
  fitScore: string;
  fitReason: string;
}

interface UpcomingInterview {
  id: string;
  round: string;
  scheduledAt: string;
  application: {
    job: {
      title: string;
      company: string;
    };
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    jobsFound: 0,
    resumesTailored: 0,
    interviewsScheduled: 0,
    contactsTotal: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch jobs
      const jobsRes = await fetch('/api/jobs');
      const jobsData = await jobsRes.json();
      
      // 2. Fetch applications
      const appsRes = await fetch('/api/applications');
      const appsData = await appsRes.json();

      // 3. Fetch interviews
      const intRes = await fetch('/api/calendar');
      const intData = await intRes.json();

      // 4. Fetch contacts
      const contactsRes = await fetch('/api/outreach');
      const contactsData = await contactsRes.json();

      if (jobsData.success && appsData.success && intData.success && contactsData.success) {
        const jobs = jobsData.jobs || [];
        const apps = appsData.applications || [];
        const ints = intData.interviews || [];
        const contacts = contactsData.contacts || [];

        // Count tailored resumes
        const tailored = apps.filter((a: any) => a.tailoredCoverLetter).length;
        
        setStats({
          jobsFound: jobs.length,
          resumesTailored: tailored,
          interviewsScheduled: ints.filter((i: any) => i.status === 'SCHEDULED').length,
          contactsTotal: contacts.length,
        });

        // Filter high-fit discovered jobs (A/B fit) for recommendations
        const highFit = jobs
          .filter((j: any) => j.status === 'DISCOVERED' && (j.fitScore === 'A' || j.fitScore === 'B'))
          .slice(0, 3);
        setRecentJobs(highFit);

        // Upcoming interviews
        const upcoming = ints
          .filter((i: any) => i.status === 'SCHEDULED')
          .slice(0, 2);
        setUpcomingInterviews(upcoming);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Welcome back, AI Candidate</h1>
        <p className={styles.subtitle}>Your AI career search engine is active and scanning Greenhouse & Lever.</p>
      </header>

      {/* Metrics Row */}
      <div className={styles.metricsRow}>
        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span>Target Jobs Scraped</span>
            <span className={styles.cyanBadge}>AI Active</span>
          </div>
          <h2 className={styles.metricValue}>{stats.jobsFound}</h2>
          <p className={styles.metricSub}>Filtered for interns / freshers</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span>Resumes Customized</span>
            <span className={styles.indigoBadge}>ATS Tailored</span>
          </div>
          <h2 className={`${styles.metricValue} glow-text-indigo`}>{stats.resumesTailored}</h2>
          <p className={styles.metricSub}>Tailored Cover Letters generated</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span>Scheduled Interviews</span>
            <span className={styles.emeraldBadge}>Active Loops</span>
          </div>
          <h2 className={`${styles.metricValue} glow-text-cyan`}>{stats.interviewsScheduled}</h2>
          <p className={styles.metricSub}>Mock questions generated</p>
        </div>

        <div className={`${styles.metricCard} glass-panel`}>
          <div className={styles.metricHeader}>
            <span>Outreach Contacts</span>
            <span className={styles.cyanBadge}>LinkedIn</span>
          </div>
          <h2 className={styles.metricValue}>{stats.contactsTotal}</h2>
          <p className={styles.metricSub}>Connection notes compiled</p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loader}>
          <div className={styles.spinner}></div>
          <p>Syncing job boards and calendar events...</p>
        </div>
      ) : (
        <div className={styles.dashboardGrid}>
          {/* Recent Discovered Jobs */}
          <div className={`${styles.dashboardCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <h3>High-Fit Roles Identified</h3>
              <Link href="/jobs" className={styles.cardLink}>View All &rarr;</Link>
            </div>
            
            <div className={styles.cardBodyList}>
              {recentJobs.map((job) => (
                <div key={job.id} className={styles.listItem}>
                  <div className={styles.listMain}>
                    <div className={styles.listCompanyRow}>
                      <span className={styles.companyName}>{job.company}</span>
                      <span className={`${styles.fitBadge} ${styles[`fit_${job.fitScore}`]}`}>
                        Fit: {job.fitScore}
                      </span>
                    </div>
                    <h4 className={styles.itemTitle}>{job.title}</h4>
                    <p className={styles.itemReason}>{job.fitReason}</p>
                  </div>
                </div>
              ))}

              {recentJobs.length === 0 && (
                <div className={styles.emptyCardState}>
                  <p>No high-fit roles found. Trigger a scan in the <strong>Find Jobs</strong> tab to discover matching AI roles.</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Interviews & Preparation */}
          <div className={`${styles.dashboardCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <h3>Upcoming Interview Loops</h3>
              <Link href="/calendar" className={styles.cardLink}>Calendar &rarr;</Link>
            </div>

            <div className={styles.cardBodyList}>
              {upcomingInterviews.map((int) => (
                <div key={int.id} className={styles.listItem}>
                  <div className={styles.interviewTimeCol}>
                    <span className={styles.timeBadge}>
                      {new Date(int.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className={styles.timeSub}>
                      {new Date(int.scheduledAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.interviewMainCol}>
                    <h4 className={styles.interviewComp}>{int.application.job.company}</h4>
                    <p className={styles.interviewTitle}>{int.application.job.title}</p>
                    <p className={styles.interviewRound}>Round: {int.round}</p>
                  </div>
                </div>
              ))}

              {upcomingInterviews.length === 0 && (
                <div className={styles.emptyCardState}>
                  <p>No upcoming interviews scheduled. Update your application status in the <strong>Applications</strong> tab to schedule a loop.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
