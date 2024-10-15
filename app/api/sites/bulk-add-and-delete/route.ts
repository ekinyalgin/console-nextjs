import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    const sites = await prisma.site.findMany();
    const reportsDir = path.join(process.cwd(), 'public', 'reports');

    for (const site of sites) {
      const excelPath = path.join(reportsDir, `${site.domainName}.xlsx`);

      try {
        await fs.access(excelPath);

        // Excel dosyası varsa, URL'leri oku ve veritabanına ekle
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const urls = data.map((row: any) => row.URL || row.url).filter(Boolean);

        await prisma.uRL.createMany({
          data: urls.map((url: string) => ({
            url,
            siteId: site.id,
          })),
          skipDuplicates: true,
        });

        // Excel dosyasını sil
        await fs.unlink(excelPath);
      } catch (error) {
        // Dosya bulunamadıysa veya başka bir hata olduysa, bu siteyi atla
        console.error(`Error processing ${site.domainName}:`, error);
        continue;
      }
    }

    return NextResponse.json({ message: 'Bulk add and delete completed' });
  } catch (error) {
    console.error('Error during bulk add and delete:', error);
    return NextResponse.json(
      { error: 'Error during bulk add and delete' },
      { status: 500 }
    );
  }
}
