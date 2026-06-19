import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Polyfill DOMMatrix, ImageData, and other browser globals for Node.js environment to prevent pdf-parse/pdf.js ReferenceErrors
const polyfillGlobals = () => {
  const dummyClass = class {};
  const globalsToPolyfill = ['DOMMatrix', 'DOMMatrixReadOnly', 'ImageData', 'Path2D'];
  
  globalsToPolyfill.forEach((name) => {
    if (typeof (globalThis as any)[name] === 'undefined') {
      (globalThis as any)[name] = dummyClass;
    }
    if (typeof (global as any)[name] === 'undefined') {
      (global as any)[name] = dummyClass;
    }
  });
};
polyfillGlobals();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsedText = '';

    // Check file type and parse accordingly
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Use dynamic require to resolve ES module compilation warnings in Next.js/Turbopack
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      parsedText = pdfData.text || '';
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      parsedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Please upload a PDF or TXT file.' },
        { status: 400 }
      );
    }

    if (!parsedText.trim()) {
      return NextResponse.json({ success: false, error: 'Parsed file content is empty.' }, { status: 400 });
    }

    // 2. Use AI to extract structured candidate details from the raw resume text
    const systemPrompt = `You are a Resume Parser Agent. Your goal is to read the raw text of a candidate's resume and extract structured profile details.
Extract:
- name: Candidate's full name.
- email: Candidate's email address.
- phone: Candidate's phone number.
- targetRoles: Comma-separated list of target role titles (e.g. AI Intern, Machine Learning Engineer Intern). Look at their background and skills to define appropriate junior/intern AI roles.
- bio: A concise, professional summary/bio (2-3 sentences).
- skills: Comma-separated list of core technical skills, programming languages, and AI/ML frameworks.
- experience: A cleanly formatted, markdown-compatible summary of their experience, education, and projects. Keep it rich and comprehensive, preserving key details and metrics.

Format your output EXACTLY as a JSON object:
{
  "name": "...",
  "email": "...",
  "phone": "...",
  "targetRoles": "...",
  "bio": "...",
  "skills": "...",
  "experience": "..."
}`;

    const prompt = `Raw Resume Text:
${parsedText.substring(0, 8000)} // Truncated to prevent context overflow

Extract details and output JSON:`;

    const aiRes = await fetch('http://localhost:3000/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI extraction service failed: ${aiRes.statusText}`);
    }

    const aiData = await aiRes.json();
    const jsonMatch = aiData.content.match(/\{[\s\S]*?\}/);

    if (!jsonMatch) {
      throw new Error('AI returned an unparsable response format.');
    }

    const parsedProfile = JSON.parse(jsonMatch[0]);

    // 3. Upsert extracted profile into the SQLite database
    let profile = await prisma.userProfile.findFirst();

    if (profile) {
      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          name: parsedProfile.name || profile.name,
          email: parsedProfile.email || profile.email,
          phone: parsedProfile.phone || profile.phone,
          bio: parsedProfile.bio || profile.bio,
          skills: parsedProfile.skills || profile.skills,
          targetRoles: parsedProfile.targetRoles || profile.targetRoles,
          experience: parsedProfile.experience || profile.experience,
        },
      });
    } else {
      profile = await prisma.userProfile.create({
        data: {
          name: parsedProfile.name || 'AI Candidate',
          email: parsedProfile.email || 'candidate@domain.com',
          phone: parsedProfile.phone || '',
          bio: parsedProfile.bio || '',
          skills: parsedProfile.skills || '',
          targetRoles: parsedProfile.targetRoles || '',
          experience: parsedProfile.experience || '',
        },
      });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: 'Resume parsed and profile updated automatically!',
    });
  } catch (error: any) {
    console.error('Resume upload/parsing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
