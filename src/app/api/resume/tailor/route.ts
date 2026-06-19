import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { TAILOR_SYSTEM_PROMPT } from '@/lib/aiInstructions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId } = body;

    // 1. Fetch application details
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!app) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    // 2. Fetch user profile
    const profile = await prisma.userProfile.findFirst();
    if (!profile) {
      return NextResponse.json({ success: false, error: 'User profile not found. Please fill in your details.' }, { status: 400 });
    }

    // 3. Draft tailored cover letter and resume bullet suggestions using AI
    const systemPrompt = TAILOR_SYSTEM_PROMPT;

    const prompt = `Candidate Profile:
Name: ${profile.name}
Bio: ${profile.bio}
Skills: ${profile.skills}
Target Roles: ${profile.targetRoles}
Experience: ${profile.experience || 'Not filled yet'}

Job Posting:
Title: ${app.job.title}
Company: ${app.job.company}
Description: ${app.job.description.substring(0, 3000)}

Tailor the candidate's documentation to fit this job and output JSON:`;

    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!response.ok) {
      throw new Error(`AI Tailoring service failed: ${response.statusText}`);
    }

    const data = await response.json();
    const jsonMatch = data.content.match(/\{[\s\S]*?\}/);
    
    if (!jsonMatch) {
      throw new Error('AI returned an unparsable response format.');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // 4. Update the database record with the tailored cover letter
    const updatedApp = await prisma.application.update({
      where: { id: applicationId },
      data: {
        tailoredCoverLetter: parsed.coverLetter || '',
        notes: `${app.notes || ''}\n[AI Tailor suggestions]: ${parsed.resumeSuggestions || ''}`,
      },
    });

    return NextResponse.json({
      success: true,
      coverLetter: parsed.coverLetter,
      resumeSuggestions: parsed.resumeSuggestions,
      application: updatedApp,
    });
  } catch (error: any) {
    console.error('Tailoring error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
