import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.siteLanguage.deleteMany({ where: { languageId: id } });
    await prisma.siteLanguages.delete({ where: { id } });
    return NextResponse.json({ message: 'Language deleted successfully' });
  } catch (error) {
    console.error('Error deleting language:', error);
    return NextResponse.json(
      { error: 'Error deleting language' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name } = body;

    const updatedLanguage = await prisma.siteLanguages.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedLanguage);
  } catch (error) {
    console.error('Error updating language:', error);
    return NextResponse.json(
      { error: 'Error updating language' },
      { status: 500 }
    );
  }
}
