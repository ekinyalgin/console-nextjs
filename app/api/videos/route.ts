import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/auth';
import { Prisma } from '@prisma/client'; // Prisma hata tipini ekliyoruz

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const videos = await prisma.video.findMany();
  return NextResponse.json(videos);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, url, note } = await request.json();

  try {
    const video = await prisma.video.create({
      data: { title, url, note },
    });
    return NextResponse.json(video);
  } catch (error) {
    // Prisma hatası olup olmadığını kontrol ediyoruz
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { message: 'URL must be unique' },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 });
  }
}
