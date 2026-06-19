import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      include: {
        job: true,
        interviews: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, status, notes } = body;

    const newApp = await prisma.application.create({
      data: {
        jobId,
        status: status || 'WISHLIST',
        notes,
        dateApplied: status === 'APPLIED' ? new Date() : null,
      },
      include: { job: true },
    });

    return NextResponse.json({ success: true, application: newApp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes, tailoredCoverLetter, tailoredResumeUrl } = body;

    const data: any = {};
    if (status !== undefined) {
      data.status = status;
      if (status === 'APPLIED' && !data.dateApplied) {
        data.dateApplied = new Date();
      }
    }
    if (notes !== undefined) data.notes = notes;
    if (tailoredCoverLetter !== undefined) data.tailoredCoverLetter = tailoredCoverLetter;
    if (tailoredResumeUrl !== undefined) data.tailoredResumeUrl = tailoredResumeUrl;

    const updatedApp = await prisma.application.update({
      where: { id },
      data,
      include: { job: true },
    });

    // Sync back to Job status
    let jobStatus = 'DISCOVERED';
    if (status === 'APPLIED') jobStatus = 'APPLIED';
    else if (status === 'WISHLIST') jobStatus = 'DISCOVERED';
    
    await prisma.job.update({
      where: { id: updatedApp.jobId },
      data: { status: jobStatus },
    });

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
