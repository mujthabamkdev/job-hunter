import { NextResponse } from 'next/server';
import { runScraper } from '@/lib/worker';

export async function POST() {
  try {
    const newJobsCount = await runScraper();
    return NextResponse.json({ success: true, newJobsCount });
  } catch (error: any) {
    console.error('Manual scrape error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
