import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
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

    const fileBuffer = await fs.readFile(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const urls = data.map((row: any) => row.URL || row.url).filter(Boolean);

    return NextResponse.json(urls);
  } catch (error) {
    console.error('Error loading Excel file:', error);
    return NextResponse.json(
      { error: 'Error loading Excel file' },
      { status: 500 }
    );
  }
}
