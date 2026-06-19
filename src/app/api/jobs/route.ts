import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      include: { application: true },
    });
    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, fitScore } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (fitScore !== undefined) data.fitScore = fitScore;

    const updatedJob = await prisma.job.update({
      where: { id },
      data,
    });

    // If status is changed to APPLIED, auto-create an Application record if not exists
    if (status === 'APPLIED') {
      const existingApp = await prisma.application.findUnique({
        where: { jobId: id },
      });
      if (!existingApp) {
        await prisma.application.create({
          data: {
            jobId: id,
            status: 'APPLIED',
            dateApplied: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
