import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { startJobCron } from '@/lib/worker';

// Start job scraper cron worker
try {
  startJobCron();
} catch (e) {
  console.error('Failed to start job cron:', e);
}

export const metadata: Metadata = {
  title: 'JobHunter AI | AI-Powered Job Search Assistant',
  description: 'Self-hosted, private, end-to-end career copilot designed for AI Freshers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
