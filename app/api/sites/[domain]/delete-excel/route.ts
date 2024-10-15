import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;

  try {
    const fileName = `${domain}.xlsx`;
    const filePath = path.join(process.cwd(), 'public', 'reports', fileName);

    await fs.unlink(filePath);

    return NextResponse.json({ message: 'Excel file deleted successfully' });
  } catch (error) {
    console.error('Error deleting Excel file:', error);
    return NextResponse.json(
      { error: 'Error deleting Excel file' },
      { status: 500 }
    );
  }
}
