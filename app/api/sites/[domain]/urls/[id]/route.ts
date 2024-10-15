import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { domain: string; id: string } }
) {
  const { domain, id } = params;

  try {
    const site = await prisma.site.findUnique({
      where: { domainName: domain },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const deletedUrl = await prisma.uRL.delete({
      where: { id: parseInt(id), siteId: site.id },
    });

    return NextResponse.json(deletedUrl);
  } catch (error) {
    console.error('Error deleting URL:', error);
    return NextResponse.json({ error: 'Error deleting URL' }, { status: 500 });
  }
}
