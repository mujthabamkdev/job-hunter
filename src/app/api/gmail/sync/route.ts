import { NextResponse } from 'next/server';
import { syncGmailResponses } from '@/lib/gmail';

export async function POST() {
  try {
    const syncResult = await syncGmailResponses();
    return NextResponse.json({ success: true, ...syncResult });
  } catch (error: any) {
    console.error('Gmail sync endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
