import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;
  const { searchParams } = new URL(request.url);
  const reviewed = searchParams.get('reviewed') === 'true';

  try {
    const site = await prisma.site.findUnique({
      where: { domainName: domain },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const urls = await prisma.uRL.findMany({
      where: {
        siteId: site.id,
        reviewed: reviewed,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(urls);
  } catch (error) {
    console.error('Error fetching URLs:', error);
    return NextResponse.json({ error: 'Error fetching URLs' }, { status: 500 });
  }
}
