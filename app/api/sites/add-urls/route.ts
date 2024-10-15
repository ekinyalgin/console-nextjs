import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { urls, domain } = await request.json();

  try {
    const site = await prisma.site.findUnique({
      where: { domainName: domain },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const createdUrls = await prisma.uRL.createMany({
      data: urls.map((url: string) => ({
        url,
        siteId: site.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json(createdUrls);
  } catch (error) {
    console.error('Error adding URLs:', error);
    return NextResponse.json({ error: 'Error adding URLs' }, { status: 500 });
  }
}
