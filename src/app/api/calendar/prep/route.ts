import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { INTERVIEW_PREP_SYSTEM_PROMPT, INTERVIEW_FEEDBACK_SYSTEM_PROMPT } from '@/lib/aiInstructions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { interviewId, notesFeedback } = body;

    if (!interviewId) {
      return NextResponse.json({ success: false, error: 'Interview ID is required.' }, { status: 400 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: { include: { job: true } } },
    });

    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found.' }, { status: 404 });
    }

    // A. Perform post-interview performance review if feedback notes are provided
    if (notesFeedback) {
      const systemPrompt = INTERVIEW_FEEDBACK_SYSTEM_PROMPT;

      const prompt = `Job Title: ${interview.application.job.title}
Company: ${interview.application.job.company}
Round: ${interview.round}

Candidate Interview Notes / Transcript:
${notesFeedback}

Provide professional performance analysis, grading, and preparation tips for next time:`;

      const response = await fetch('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed.');
      }

      const data = await response.json();
      
      const updatedInterview = await prisma.interview.update({
        where: { id: interviewId },
        data: {
          responseReview: data.content,
          status: 'COMPLETED',
        },
      });

      return NextResponse.json({ success: true, responseReview: data.content, interview: updatedInterview });
    }

    // B. Otherwise, generate pre-interview study prep materials
    const profile = await prisma.userProfile.findFirst();
    const skills = profile?.skills || 'Python, ML';
    
    const systemPrompt = INTERVIEW_PREP_SYSTEM_PROMPT;

    const prompt = `Candidate Resume Skills: ${skills}
Job Title: ${interview.application.job.title}
Company: ${interview.application.job.company}
Round/Type: ${interview.round}
Job Description:
${interview.application.job.description.substring(0, 3000)}

Generate Study & Prep Material:`;

    const response = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to communicate with AI endpoint.');
    }

    const data = await response.json();

    const updatedInterview = await prisma.interview.update({
      where: { id: interviewId },
      data: {
        prepMaterial: data.content,
      },
    });

    return NextResponse.json({
      success: true,
      prepMaterial: data.content,
      interview: updatedInterview,
    });
  } catch (error: any) {
    console.error('Interview prep endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
