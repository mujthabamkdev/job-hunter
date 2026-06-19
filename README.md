# JobHunter AI

**JobHunter AI** is a premium, self-hosted, local-first career copilot designed for AI Freshers and Interns to discover, track, tailor, and prepare for job applications. 

It keeps all your sensitive data (resumes, credentials, notes) **100% private and stored locally on your macOS machine** using SQLite, while integrating with **OpenRouter's free tier** (or Google Gemini / local Ollama) to automate time-consuming job search workflows.

---

## Key Features

1.  **AI Resume Upload & Parser:** Select a PDF or TXT resume. The system extracts your Name, Email, Bio, Skills, and Experience to automatically populate your profile details in one click.
2.  **Automated Job Board Scraper:** Automatically scans startup Greenhouse and Lever job board APIs ( OpenAI, Anthropic, Scale AI, Vercel, LangChain, etc.) every 3 hours. It filters for AI/ML fresher roles and assigns an **A-F fit score** based on your resume.
3.  **Visual Kanban Board:** A drag-and-drop tracker (Wishlist, Applied, Interviewing, Offered, Rejected) with notes and status transitions.
4.  **Gmail Response Tracker:** Connects to Gmail via IMAP over a secure TLS connection. Reads responses from target companies, runs AI text classification, and automatically promotes application states to "Interviewing" or "Rejected".
5.  **GitHub Portfolio Analyzer:** Audits your public repositories, identifies ML tool gaps, provides README improvements, and maps out milestones for a high-impact AI project to build.
6.  **CV & Cover Letter Tailorer:** Dynamically optimizes your resume bullet points and generates custom Cover Letters matching selected job descriptions in seconds.
7.  **Interview Calendar & Prep:** Schedule loops and automatically generate targeted study plans, custom cheat sheets, and 8+ mock questions. Input notes to get post-interview performance analysis.
8.  **LinkedIn Outreach Agent:** Drafts connection notes and provides a headed Playwright browser script to safely message recruiters locally on your Mac.
9.  **Web Configuration Settings:** Configure your API keys (OpenRouter, Gemini, GitHub, Gmail) directly from the Web UI—no environment file edits required.

---

## Tech Stack

*   **Framework:** Next.js 16 (App Router) + TypeScript
*   **Database:** SQLite + Prisma ORM (Database connection can be swapped to PostgreSQL like Supabase/Neon for cloud deployment)
*   **Styling:** Custom Vanilla CSS Modules (featuring glassmorphism, animated glow highlights, and responsive layouts)
*   **AI:** OpenRouter API (Gemini/Llama Free), Google Gemini API, and local Ollama
*   **Email Sync:** Node IMAP + Simple Mail Parser
*   **Resume Parser:** PDF-Parse + Node Dynamic Buffer
*   **Automation:** Playwright (Local Headed Chrome)

---

## Getting Started & Installation

### Prerequisites
*   **Node.js** (v18 or higher) installed on your Mac.
*   **npm** (bundled with Node).
*   **Git** installed.

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/mujthabamkdev/job-hunter.git
cd job-hunter

# Install dependencies
npm install
```

### 2. Configure Database & Environment
1. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
2. Initialize and sync your local SQLite database:
   ```bash
   npx prisma db push
   ```

### 3. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the dashboard!

---

## Usage Guide

1.  **Configure API Keys:** Go to the **Settings** tab and paste your **OpenRouter API Key** (you can create a free key at [OpenRouter.ai](https://openrouter.ai/) to access free-tier models).
2.  **Import Profile:** Go to **My Profile**, upload your resume PDF/TXT, and click **Parse & Import**. Review the auto-populated details and save.
3.  **Scan for Internships:** Navigate to **Find Jobs** and click **Scan For New Jobs** to sweep active boards. Save matching roles to your **Wishlist**.
4.  **Tailor Documents:** When ready to apply, select the job on the **Resumes & Letters** tab and click **Tailor CV & Cover Letter** to generate optimized documents.
5.  **Outreach Recruiters:** Check the **LinkedIn Agent** tab to view AI connection notes and copy the helper Playwright script to automate connection requests safely.

---

## Developer Guide

### Project File Structure
```
job-hunter/
├── prisma/
│   └── schema.prisma        # SQLite database tables schema
├── src/
│   ├── app/
│   │   ├── api/             # API routes (ai, scraping, gmail, tailoring, calendar)
│   │   ├── applications/    # Kanban dashboard view
│   │   ├── calendar/        # Interview timeline and prep generator
│   │   ├── career/          # Career milestones planner
│   │   ├── dashboard/       # Main home dashboard
│   │   ├── jobs/            # Job board scraper listings
│   │   ├── outreach/        # LinkedIn recruiter contact dashboard
│   │   ├── profile/         # Candidate details form and resume parser
│   │   ├── projects/        # GitHub portfolio analyzer
│   │   ├── resume/          # Tailoring customizer panel
│   │   ├── settings/        # System configuration inputs
│   │   ├── globals.css      # Core Design System, colors, animations
│   │   └── layout.tsx       # Root Layout linking Sidebar navigation
│   └── lib/
│       ├── aiInstructions.ts # Central system prompts for AI
│       ├── config.ts        # Environment & database settings resolver
│       ├── db.ts            # Prisma client singleton instance
│       ├── gmail.ts         # IMAP connection parsing utilities
│       └── worker.ts        # Scraper queries and scoring scheduler
└── AI_INSTRUCTIONS.md       # Reference manual for all system prompts
```

### Modifying AI System Prompts
To adjust how the AI evaluates jobs, tailors cover letters, or reviews interviews:
* Edit the prompts inside **[AI_INSTRUCTIONS.md](AI_INSTRUCTIONS.md)** for reference.
* Update the matching string constants in **[src/lib/aiInstructions.ts](src/lib/aiInstructions.ts)**. Next.js will automatically hot-reload the route handlers.

### Schema Updates
If you add fields or models to the database:
1. Edit **[prisma/schema.prisma](prisma/schema.prisma)**.
2. Run database sync command:
   ```bash
   npx prisma db push
   ```
   This will automatically update the generated TypeScript types for `@prisma/client`.
