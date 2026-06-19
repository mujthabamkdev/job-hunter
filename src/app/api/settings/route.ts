import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settingsList = await prisma.settings.findMany();
    // Reduce into key-value map
    const settings: Record<string, string> = {};
    settingsList.forEach((s) => {
      // Mask values for security in GET
      settings[s.key] = s.value ? '••••••••••••' : '';
    });
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { openrouterKey, geminiKey, githubToken, gmailUser, gmailPass } = body;

    const updates = [
      { key: 'OPENROUTER_API_KEY', value: openrouterKey },
      { key: 'GEMINI_API_KEY', value: geminiKey },
      { key: 'GITHUB_TOKEN', value: githubToken },
      { key: 'GMAIL_USER', value: gmailUser },
      { key: 'GMAIL_PASS', value: gmailPass },
    ];

    for (const update of updates) {
      if (update.value === undefined) continue;
      // If user passed masked placeholder, do not overwrite existing value
      if (update.value === '••••••••••••') continue;

      await prisma.settings.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });

      // Also sync dynamically to process.env so that standard backend calls can read them immediately
      process.env[update.key] = update.value;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
