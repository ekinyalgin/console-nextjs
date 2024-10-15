import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
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
    return NextResponse.json(sites);
  } catch (error) {
    console.error('Error fetching sites:', error);
    return NextResponse.json(
      { error: 'Error fetching sites' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { domainName, monthly, categoryIds, languageIds } = body;

    const site = await prisma.site.create({
      data: {
        domainName,
        monthly: parseInt(monthly), // monthly'yi sayıya çeviriyoruz
        categories: {
          create: categoryIds.map((categoryId: number) => ({
            category: {
              connect: { id: categoryId },
            },
          })),
        },
        languages: {
          create: languageIds.map((languageId: number) => ({
            language: {
              connect: { id: languageId },
            },
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
    console.error('Error creating site:', error);
    return NextResponse.json({ error: 'Error creating site' }, { status: 500 });
  }
}
