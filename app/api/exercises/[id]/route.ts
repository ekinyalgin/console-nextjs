import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.exercise.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const updatedExercise = await prisma.exercise.update({
      where: { id },
      data: body,
    });
    return NextResponse.json(updatedExercise);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}
