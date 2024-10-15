import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const languages = await prisma.siteLanguages.findMany();
    return NextResponse.json(languages);
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Error fetching languages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    const language = await prisma.siteLanguages.create({
      data: { name },
    });

    return NextResponse.json(language);
  } catch (error) {
    console.error('Error creating language:', error);
    return NextResponse.json(
      { error: 'Error creating language' },
      { status: 500 }
    );
  }
}
