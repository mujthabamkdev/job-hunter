import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { CAREER_ROADMAP_SYSTEM_PROMPT } from '@/lib/aiInstructions';

export async function GET() {
  try {
    const profile = await prisma.userProfile.findFirst();
    const skills = profile?.skills || 'Python, ML';
    const targetRoles = profile?.targetRoles || 'AI Intern / ML Engineer Intern';

    const systemPrompt = CAREER_ROADMAP_SYSTEM_PROMPT;

    const prompt = `Candidate Profile:
Current Skills: ${skills}
Targeting: ${targetRoles}

Generate 3-stage Career Roadmap:`;

    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!response.ok) {
      throw new Error('AI career generator failed.');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, roadmap: data.content });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
