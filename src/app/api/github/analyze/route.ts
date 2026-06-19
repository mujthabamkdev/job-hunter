import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GITHUB_ANALYZE_SYSTEM_PROMPT } from '@/lib/aiInstructions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, token } = body;

    if (!username) {
      return NextResponse.json({ success: false, error: 'GitHub username is required.' }, { status: 400 });
    }

    // 1. Fetch public repos from GitHub API
    const headers: any = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'JobHunter-AI-App',
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    } else if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const githubRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=15`, {
      headers,
    });

    if (!githubRes.ok) {
      throw new Error(`GitHub API returned ${githubRes.status}: ${githubRes.statusText}`);
    }

    const reposData = await githubRes.json();
    const parsedRepos = reposData.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description provided.',
      language: repo.language || 'N/A',
      stars: repo.stargazers_count,
      url: repo.html_url,
    }));

    // 2. Fetch profile targets
    const profile = await prisma.userProfile.findFirst();
    const targetRoles = profile?.targetRoles || 'AI Intern / ML Engineer Intern';
    const skills = profile?.skills || 'Python, Machine Learning';

    // 3. Compile portfolio and prompt AI
    const systemPrompt = GITHUB_ANALYZE_SYSTEM_PROMPT;

    const prompt = `GitHub Username: ${username}
Target Roles: ${targetRoles}
Current Skills list: ${skills}

Current Repositories:
${JSON.stringify(parsedRepos, null, 2)}

Provide portfolio feedback and output JSON:`;

    const aiResponse = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI analysis service failed.');
    }

    const aiData = await aiResponse.json();
    const jsonMatch = aiData.content.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error('AI returned an unparsable response format.');
    }

    const parsedAI = JSON.parse(jsonMatch[0]);

    // Save project analytics to SQLite
    // Clear old projects first to avoid duplicate listings
    await prisma.project.deleteMany({});
    
    // Save recommended project
    await prisma.project.create({
      data: {
        name: parsedAI.recommendedProject.name,
        description: parsedAI.recommendedProject.description,
        techStack: parsedAI.recommendedProject.stack,
        aiAnalysis: JSON.stringify(parsedAI),
      },
    });

    return NextResponse.json({
      success: true,
      repos: parsedRepos,
      analysis: parsedAI,
    });
  } catch (error: any) {
    console.error('GitHub analysis error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
