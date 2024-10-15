import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

function formatTitle(title: string): string {
  return title
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\|/g, '-')
    .replace(/"/g, '');
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const videos = await request.json();

  try {
    const importedVideos = await prisma.$transaction(
      videos.map((video: { title: string; url: string; note?: string }) =>
        prisma.video.create({
          data: {
            title: formatTitle(video.title),
            url: video.url,
            note: video.note,
          },
        })
      )
    );

    return NextResponse.json(importedVideos);
  } catch (error) {
    console.error('Error importing videos:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate URL found' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to import videos' },
      { status: 500 }
    );
  }
}
