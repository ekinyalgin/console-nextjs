import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Link'in tipini tanımlıyoruz
interface Link {
  url: string;
  icon: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const todo = await prisma.todo.findUnique({
      where: { id: parseInt(params.id) },
      include: { links: true },
    });

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    return NextResponse.json({ error: 'Error fetching todo' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      title,
      date,
      note,
      links,
    }: { title: string; date: string; note: string; links: Link[] } = body;

    const updatedTodo = await prisma.todo.update({
      where: { id: parseInt(params.id) },
      data: {
        title,
        date: new Date(date),
        note,
        links: {
          deleteMany: {}, // Mevcut linkleri sil
          create: links.map((link: Link) => ({
            url: link.url,
            icon: link.icon,
          })),
        },
      },
      include: { links: true },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);

    // Error'ın bir "message" özelliğine sahip olup olmadığını kontrol ediyoruz
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Error updating todo', details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Error updating todo', details: String(error) },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.todo.delete({
      where: { id: parseInt(params.id) },
    });

    return NextResponse.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Error deleting todo' }, { status: 500 });
  }
}
