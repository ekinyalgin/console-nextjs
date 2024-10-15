import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        languages: {
          include: {
            language: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error fetching site:', error);
    return NextResponse.json({ error: 'Error fetching site' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { domainName, monthly, categoryIds, languageIds } = body;

    const site = await prisma.site.update({
      where: { id },
      data: {
        domainName,
        monthly: parseInt(monthly),
        categories: {
          deleteMany: {},
          create:
            categoryIds?.map((categoryId: number) => ({
              category: {
                connect: { id: categoryId },
              },
            })) || [],
        },
        languages: {
          deleteMany: {},
          create:
            languageIds?.map((languageId: number) => ({
              language: {
                connect: { id: languageId },
              },
            })) || [],
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        languages: {
          include: {
            language: true,
          },
        },
      },
    });

    return NextResponse.json(site);
  } catch (error) {
    console.error('Error updating site:', error);
    return NextResponse.json({ error: 'Error updating site' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Site'ı sil (ilişkili SiteCategory ve SiteLanguage kayıtları otomatik olarak silinecek)
    await prisma.site.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Error deleting site' }, { status: 500 });
  }
}
