import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // Prisma hata tipini içe aktarıyoruz

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const video = await prisma.video.create({
      data: {
        title: body.title,
        url: body.url,
        note: body.note,
      },
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
    // Diğer tüm hata durumları
    return NextResponse.json(
      { error: 'An error occurred while creating the video' },
      { status: 500 }
    );
  }
}
