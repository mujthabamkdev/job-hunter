import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { prisma } from './db';
import { EMAIL_SYNC_SYSTEM_PROMPT } from './aiInstructions';

// Helper to format date for IMAP search (e.g. "19-Jun-2026")
function getImapDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

async function classifyEmailWithAI(subject: string, bodyText: string): Promise<{ type: 'INTERVIEW' | 'REJECTION' | 'OTHER'; details: string }> {
  try {
    const systemPrompt = EMAIL_SYNC_SYSTEM_PROMPT;

    const prompt = `Subject: ${subject}
Email Content:
${bodyText.substring(0, 2000)} // Truncated

Analyze response:`;

    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!response.ok) {
      return { type: 'OTHER', details: '' };
    }

    const data = await response.json();
    const jsonMatch = data.content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type || 'OTHER',
        details: parsed.details || '',
      };
    }
    return { type: 'OTHER', details: '' };
  } catch (err) {
    console.error('Error classifying email with AI:', err);
    return { type: 'OTHER', details: '' };
  }
}

export async function syncGmailResponses(): Promise<{ updatedCount: number; logs: string[] }> {
  const logs: string[] = [];
  let updatedCount = 0;

  const email = process.env.GMAIL_USER;
  const password = process.env.GMAIL_PASS;

  if (!email || !password) {
    logs.push('Gmail credentials not configured in environment.');
    return { updatedCount, logs };
  }

  // Fetch all applications in progress
  const activeApplications = await prisma.application.findMany({
    where: {
      status: { in: ['APPLIED', 'INTERVIEWING'] }
    },
    include: {
      job: true
    }
  });

  if (activeApplications.length === 0) {
    logs.push('No active job applications found in APPLIED or INTERVIEWING state.');
    return { updatedCount, logs };
  }

  return new Promise((resolve) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    function endConnection() {
      try {
        imap.end();
      } catch (err) {}
    }

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          logs.push(`Error opening INBOX: ${err.message}`);
          endConnection();
          return resolve({ updatedCount, logs });
        }

        // Search criteria: Emails from the last 7 days containing "application", "interview", "resume", etc.
        const dateStr = getImapDateString(7);
        imap.search([['SINCE', dateStr]], (err, results) => {
          if (err || !results || results.length === 0) {
            logs.push('No new emails found in the last 7 days.');
            endConnection();
            return resolve({ updatedCount, logs });
          }

          const f = imap.fetch(results, { bodies: '' });
          let processed = 0;
          const total = results.length;

          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream as any, async (err, parsed) => {
                processed++;
                if (err) return;

                const subject = parsed.subject || '';
                const bodyText = parsed.text || '';
                const fromAddress = parsed.from?.value?.[0]?.address || '';

                // Check if email domain matches any of our target companies
                for (const app of activeApplications) {
                  const companyNameLower = app.job.company.toLowerCase();
                  const inSubject = subject.toLowerCase().includes(companyNameLower);
                  const inFrom = fromAddress.toLowerCase().includes(companyNameLower);

                  if (inSubject || inFrom) {
                    logs.push(`Found email from ${app.job.company}: "${subject}"`);
                    
                    // Classify content using AI
                    const aiClassify = await classifyEmailWithAI(subject, bodyText);
                    
                    if (aiClassify.type === 'INTERVIEW' && app.status !== 'INTERVIEWING') {
                      // Update status to Interviewing
                      await prisma.application.update({
                        where: { id: app.id },
                        data: {
                          status: 'INTERVIEWING',
                          notes: `${app.notes || ''}\n[Gmail Sync ${new Date().toLocaleDateString()}]: ${aiClassify.details}`,
                        }
                      });
                      
                      // Auto-schedule an interview slot placeholder
                      await prisma.interview.create({
                        data: {
                          applicationId: app.id,
                          round: 'AI Detected Interview Invitation',
                          scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Default 2 days from now
                          notes: `Detected via email: "${subject}". Details: ${aiClassify.details}`,
                          status: 'SCHEDULED',
                        }
                      });

                      logs.push(`Updated ${app.job.company} status to INTERVIEWING`);
                      updatedCount++;
                    } else if (aiClassify.type === 'REJECTION' && app.status !== 'REJECTED') {
                      // Update status to Rejected
                      await prisma.application.update({
                        where: { id: app.id },
                        data: {
                          status: 'REJECTED',
                          notes: `${app.notes || ''}\n[Gmail Sync ${new Date().toLocaleDateString()}]: ${aiClassify.details}`,
                        }
                      });
                      logs.push(`Updated ${app.job.company} status to REJECTED`);
                      updatedCount++;
                    }
                    break; // match found, skip checking other companies for this email
                  }
                }

                if (processed === total) {
                  endConnection();
                }
              });
            });
          });

          f.once('error', (err) => {
            logs.push(`Fetch error: ${err.message}`);
          });

          f.once('end', () => {
            // Fetch finished, resolve once all messages processed (handled inside simplesParser async loop)
            setTimeout(() => {
              endConnection();
              resolve({ updatedCount, logs });
            }, 3000);
          });
        });
      });
    });

    imap.once('error', (err) => {
      logs.push(`IMAP Connection Error: ${err.message}`);
      resolve({ updatedCount, logs });
    });

    imap.connect();
  });
}
