import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { minVisitors, maxVisitors, changeValue, changeType, category } =
      body;

    const updatedSites = await prisma.site.updateMany({
      where: {
        monthly: {
          gte: parseInt(minVisitors),
          lte: parseInt(maxVisitors),
        },
        categories: {
          some: {
            categoryId: category,
          },
        },
      },
      data: {
        monthly: {
          [changeType === 'increase' ? 'increment' : 'decrement']:
            parseInt(changeValue),
        },
      },
    });

    const sites = await prisma.site.findMany({
      where: {
        categories: {
          some: {
            categoryId: category,
          },
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

    return NextResponse.json({ updatedSites: sites });
  } catch (error) {
    console.error('Error during bulk update:', error);
    return NextResponse.json(
      { error: 'Error during bulk update' },
      { status: 500 }
    );
  }
}
