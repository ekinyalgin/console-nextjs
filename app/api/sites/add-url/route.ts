import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { url, domain } = await request.json();

  try {
    const site = await prisma.site.findUnique({
      where: { domainName: domain },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const createdUrl = await prisma.uRL.create({
      data: {
        url,
        siteId: site.id,
      },
    });

    return NextResponse.json(createdUrl);
  } catch (error) {
    console.error('Error adding URL:', error);
    return NextResponse.json({ error: 'Error adding URL' }, { status: 500 });
  }
}
