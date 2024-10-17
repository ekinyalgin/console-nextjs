import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const exercises = await prisma.exercise.findMany();
    return NextResponse.json(exercises);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch exercises' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const exercise = await prisma.exercise.create({
      data: body,
    });
    return NextResponse.json(exercise);
  } catch {
    return NextResponse.json(
      { error: 'Failed to create exercise' },
      { status: 500 }
    );
  }
}
