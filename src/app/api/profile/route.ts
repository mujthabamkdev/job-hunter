import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let profile = await prisma.userProfile.findFirst();
    if (!profile) {
      // Seed default empty profile
      profile = await prisma.userProfile.create({
        data: {
          name: 'AI Candidate',
          email: 'candidate@domain.com',
          phone: '',
          bio: 'AI Engineer Fresher / Intern candidate looking for opportunities.',
          skills: 'Python, Machine Learning, Deep Learning, PyTorch, SQL',
          targetRoles: 'AI Intern, Machine Learning Engineer Intern, Data Scientist Intern',
          experience: '',
        },
      });
    }
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, bio, skills, targetRoles, experience } = body;

    let profile = await prisma.userProfile.findFirst();
    
    if (profile) {
      profile = await prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          name: name ?? profile.name,
          email: email ?? profile.email,
          phone: phone ?? profile.phone,
          bio: bio ?? profile.bio,
          skills: skills ?? profile.skills,
          targetRoles: targetRoles ?? profile.targetRoles,
          experience: experience ?? profile.experience,
        },
      });
    } else {
      profile = await prisma.userProfile.create({
        data: {
          name: name || 'AI Candidate',
          email: email || 'candidate@domain.com',
          phone: phone || '',
          bio: bio || '',
          skills: skills || '',
          targetRoles: targetRoles || '',
          experience: experience || '',
        },
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
