import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;

  try {
    const site = await prisma.site.findUnique({
      where: { domainName: domain },
      include: {
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
