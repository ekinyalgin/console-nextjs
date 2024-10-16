import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const { hasExcel } = await request.json();
  const { domain } = params;

  try {
    const updatedSite = await prisma.site.update({
      where: { domainName: domain },
      data: { hasExcel },
    });

    return NextResponse.json(updatedSite);
  } catch (error) {
    console.error('Error updating Excel status:', error);
    return NextResponse.json(
      { error: 'Error updating Excel status' },
      { status: 500 }
    );
  }
}
