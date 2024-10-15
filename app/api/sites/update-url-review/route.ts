import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { id, reviewed } = await request.json();

  try {
    const updatedUrl = await prisma.uRL.update({
      where: { id },
      data: { reviewed },
    });

    return NextResponse.json(updatedUrl);
  } catch (error) {
    console.error('Error updating URL review status:', error);
    return NextResponse.json(
      { error: 'Error updating URL review status' },
      { status: 500 }
    );
  }
}
