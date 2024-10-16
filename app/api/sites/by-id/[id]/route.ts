import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  try {
    const site = await prisma.site.findUnique({
      where: { id }, // Burada değişiklik yapıldı
      include: {
        languages: {
          include: {
            language: true,
          },
        },
        categories: {
          include: {
            category: true,
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
  const id = parseInt(params.id);
  const body = await request.json();
  const { domainName, monthly, categoryIds, languageIds } = body;

  try {
    const site = await prisma.site.update({
      where: { id },
      data: {
        domainName,
        monthly: parseInt(monthly),
        categories: {
          deleteMany: {},
          create: categoryIds?.map((categoryId: number) => ({
            category: { connect: { id: categoryId } },
          })),
        },
        languages: {
          deleteMany: {},
          create: languageIds?.map((languageId: number) => ({
            language: { connect: { id: languageId } },
          })),
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
  const id = parseInt(params.id);

  try {
    await prisma.$transaction([
      prisma.siteCategory.deleteMany({ where: { siteId: id } }),
      prisma.siteLanguage.deleteMany({ where: { siteId: id } }),
      prisma.uRL.deleteMany({ where: { siteId: id } }),
      prisma.site.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Error deleting site:', error);
    return NextResponse.json({ error: 'Error deleting site' }, { status: 500 });
  }
}
