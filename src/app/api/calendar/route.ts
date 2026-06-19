import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const interviews = await prisma.interview.findMany({
      include: {
        application: {
          include: { job: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return NextResponse.json({ success: true, interviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { applicationId, round, scheduledAt, notes } = body;

    const newInterview = await prisma.interview.create({
      data: {
        applicationId,
        round,
        scheduledAt: new Date(scheduledAt),
        notes,
        status: 'SCHEDULED',
      },
      include: {
        application: {
          include: { job: true },
        },
      },
    });

    // Auto-promote application status to INTERVIEWING
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'INTERVIEWING' },
    });

    return NextResponse.json({ success: true, interview: newInterview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, round, scheduledAt, notes, status } = body;

    const data: any = {};
    if (round !== undefined) data.round = round;
    if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt);
    if (notes !== undefined) data.notes = notes;
    if (status !== undefined) data.status = status;

    const updated = await prisma.interview.update({
      where: { id },
      data,
      include: {
        application: {
          include: { job: true },
        },
      },
    });

    return NextResponse.json({ success: true, interview: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
