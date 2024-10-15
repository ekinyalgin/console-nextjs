import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const exercises = await request.json();

    if (!Array.isArray(exercises)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected an array of exercises.' },
        { status: 400 }
      );
    }

    const importedExercises = await prisma.exercise.createMany({
      data: exercises.map((exercise) => ({
        title: exercise.title,
        duration: exercise.duration,
        description: exercise.description,
        videoUrl: exercise.videoUrl,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: `Successfully imported ${importedExercises.count} exercises.`,
      importedCount: importedExercises.count,
    });
  } catch (error) {
    console.error('Error importing exercises:', error);
    return NextResponse.json(
      { error: 'Failed to import exercises' },
      { status: 500 }
    );
  }
}
