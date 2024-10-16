import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (!category) {
    return NextResponse.json(
      { error: 'Category is required' },
      { status: 400 }
    );
  }

  try {
    const domains = await prisma.site.findMany({
      where: {
        categories: {
          some: {
            category: {
              name: category,
            },
          },
        },
        urls: {
          some: {
            reviewed: false,
          },
        },
      },
      select: {
        domainName: true,
      },
      take: 5,
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(domains.map((d) => d.domainName));
  } catch (error) {
    console.error('Error fetching blog domains:', error);
    return NextResponse.json(
      { error: 'Error fetching blog domains' },
      { status: 500 }
    );
  }
}
