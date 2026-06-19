import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { OUTREACH_SYSTEM_PROMPT } from '@/lib/aiInstructions';

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, title, email, linkedinUrl, status } = body;

    // Optional: Draft a custom outreach pitch for this recruiter using AI
    const profile = await prisma.userProfile.findFirst();
    const skills = profile?.skills || 'Python, ML';
    
    let outreachPitch = '';
    if (company && title) {
      const systemPrompt = OUTREACH_SYSTEM_PROMPT;

      const prompt = `Recruiter Name: ${name}
Company: ${company}
Recruiter Role: ${title}
My Core Skills: ${skills}`;

      const aiRes = await fetch('http://localhost:3000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemPrompt }),
      });

      if (aiRes.ok) {
        const data = await aiRes.json();
        outreachPitch = data.content.substring(0, 300); // LinkedIn note limit
      }
    }

    const newContact = await prisma.contact.create({
      data: {
        name,
        company,
        title,
        email,
        linkedinUrl,
        status: status || 'NOT_CONTACTED',
        outreachLog: outreachPitch,
      },
    });

    return NextResponse.json({ success: true, contact: newContact });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, outreachLog } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (outreachLog !== undefined) data.outreachLog = outreachLog;

    const updated = await prisma.contact.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
