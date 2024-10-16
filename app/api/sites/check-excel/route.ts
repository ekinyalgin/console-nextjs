import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  try {
    const fileName = `${domain}.xlsx`;
    const filePath = path.join(process.cwd(), 'public', 'reports', fileName);

    //console.log('Checking file path:', filePath);

    await fs.access(filePath);
    return NextResponse.json({ exists: true, filePath });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      //      console.log('File not found:', (error as NodeJS.ErrnoException).path);
      return NextResponse.json({
        exists: false,
        filePath: (error as NodeJS.ErrnoException).path,
      });
    }
    //console.error('Error checking Excel file:', error);
    return NextResponse.json(
      { error: 'Error checking Excel file' },
      { status: 500 }
    );
  }
}
