import cron from 'node-cron';
import { prisma } from './db';
import { SCRAPER_SYSTEM_PROMPT } from './aiInstructions';

// Popular AI companies and their ATS settings
interface CompanyBoard {
  name: string;
  provider: 'greenhouse' | 'lever';
  token: string;
}

const DEFAULT_BOARDS: CompanyBoard[] = [
  { name: 'OpenAI', provider: 'greenhouse', token: 'openai' },
  { name: 'Anthropic', provider: 'greenhouse', token: 'anthropic' },
  { name: 'Scale AI', provider: 'greenhouse', token: 'scaleai' },
  { name: 'Cohere', provider: 'greenhouse', token: 'cohere' },
  { name: 'Hugging Face', provider: 'greenhouse', token: 'huggingface' },
  { name: 'Perplexity', provider: 'greenhouse', token: 'perplexity' },
  { name: 'Pinecone', provider: 'greenhouse', token: 'pinecone' },
  { name: 'Replicate', provider: 'greenhouse', token: 'replicate' },
  { name: 'Weights & Biases', provider: 'greenhouse', token: 'weightsandbiases' },
  { name: 'Vercel', provider: 'lever', token: 'vercel' },
  { name: 'LangChain', provider: 'lever', token: 'langchain' },
  { name: 'Modal Labs', provider: 'lever', token: 'modallabs' },
];

// Keywords to filter for AI/ML freshers and interns
const INTERN_KEYWORDS = [
  'intern',
  'internship',
  'fellowship',
  'junior',
  'fresher',
  'entry-level',
  'entry level',
  'graduate',
  'new grad',
  'resident',
  'residency',
];

const AI_KEYWORDS = [
  'ai',
  'ml',
  'machine learning',
  'deep learning',
  'nlp',
  'computer vision',
  'llm',
  'generative',
  'agent',
  'transformer',
  'data scientist',
  'data science',
];

let cronStarted = false;

// Scrapes Greenhouse jobs
async function fetchGreenhouseJobs(boardToken: string): Promise<any[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs?content=true`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((job: any) => ({
      title: job.title,
      company: boardToken.toUpperCase(),
      location: job.location?.name || 'Remote / Hybrid',
      url: job.absolute_url,
      description: job.content || '',
    }));
  } catch (err) {
    console.error(`Error fetching Greenhouse for ${boardToken}:`, err);
    return [];
  }
}

// Scrapes Lever jobs
async function fetchLeverJobs(boardToken: string): Promise<any[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${boardToken}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((job: any) => ({
      title: job.text,
      company: boardToken.toUpperCase(),
      location: job.categories?.location || 'Remote / Hybrid',
      url: job.hostedUrl,
      description: `${job.description} ${job.lists?.map((l: any) => `${l.text}: ${l.content}`).join(' ')}` || '',
    }));
  } catch (err) {
    console.error(`Error fetching Lever for ${boardToken}:`, err);
    return [];
  }
}

// Unified call to local AI API
async function scoreJobWithAI(jobTitle: string, jobDesc: string, userSkills: string, userExperience: string): Promise<{ score: string; reason: string }> {
  try {
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
    // Construct local route payload
    const systemPrompt = SCRAPER_SYSTEM_PROMPT;

    const prompt = `Candidate Profile:
Skills: ${userSkills}
Experience/Projects Summary: ${userExperience}

Job Listing:
Title: ${jobTitle}
Description: ${jobDesc.substring(0, 4000)} // Truncated to fit context window

Analyze fit score and output JSON:`;

    // Make local HTTP POST to our own AI endpoint
    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!response.ok) {
      return { score: 'C', reason: 'Failed to communicate with AI endpoint.' };
    }

    const resData = await response.json();
    
    // Try to extract JSON from AI response
    const jsonMatch = resData.content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 'C',
        reason: parsed.reason || 'AI evaluation complete.',
      };
    }

    return { score: 'C', reason: 'AI returned unparsable response.' };
  } catch (err) {
    console.error('Error scoring job with AI:', err);
    return { score: 'C', reason: 'System error during AI evaluation.' };
  }
}

export async function runScraper() {
  console.log('[Scraper] Starting job scraper job...');
  
  // 1. Fetch user profile
  const profile = await prisma.userProfile.findFirst();
  const skills = profile?.skills || 'Python, Machine Learning, Deep Learning';
  const experience = profile?.experience || 'AI student/fresher looking for internship opportunities.';

  let newJobsCount = 0;

  for (const board of DEFAULT_BOARDS) {
    let rawJobs: any[] = [];
    if (board.provider === 'greenhouse') {
      rawJobs = await fetchGreenhouseJobs(board.token);
    } else {
      rawJobs = await fetchLeverJobs(board.token);
    }

    console.log(`[Scraper] Fetched ${rawJobs.length} raw jobs for ${board.name}`);

    // Filter jobs for AI Freshers / Interns
    const filteredJobs = rawJobs.filter((job) => {
      const titleLower = job.title.toLowerCase();
      const descLower = job.description.toLowerCase();
      
      const isIntern = INTERN_KEYWORDS.some((kw) => titleLower.includes(kw) || descLower.includes(` ${kw}`));
      const isAI = AI_KEYWORDS.some((kw) => titleLower.includes(kw) || descLower.includes(kw));

      return isIntern && isAI;
    });

    console.log(`[Scraper] Found ${filteredJobs.length} AI Fresher/Intern matches for ${board.name}`);

    for (const j of filteredJobs) {
      // Check if job already exists in DB
      const existing = await prisma.job.findUnique({
        where: { url: j.url },
      });

      if (!existing) {
        // Run AI match evaluation
        const aiScore = await scoreJobWithAI(j.title, j.description, skills, experience);
        
        // Save to DB
        await prisma.job.create({
          data: {
            title: j.title,
            company: board.name,
            location: j.location,
            url: j.url,
            description: j.description,
            fitScore: aiScore.score,
            fitReason: aiScore.reason,
            status: 'DISCOVERED',
          },
        });
        newJobsCount++;
      }
    }
  }

  console.log(`[Scraper] Completed. Discovered ${newJobsCount} new target job postings.`);
  return newJobsCount;
}

export function startJobCron() {
  if (cronStarted) return;
  cronStarted = true;
  
  console.log('[Scheduler] Initializing 3-hour background job scraper...');
  
  // '0 */3 * * *' runs every 3 hours
  // For easy testing, we will run the cron task
  cron.schedule('0 */3 * * *', async () => {
    try {
      await runScraper();
    } catch (err) {
      console.error('[Scheduler] Cron error executing scraper:', err);
    }
  });
}
