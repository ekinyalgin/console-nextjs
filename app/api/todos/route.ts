import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      include: { links: true },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json(
      { error: 'Error fetching todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, date, note, links } = body;

    const todo = await prisma.todo.create({
      data: {
        title,
        date: new Date(date),
        note,
        links: {
          create: links,
        },
      },
      include: { links: true },
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Error creating todo' }, { status: 500 });
  }
}
