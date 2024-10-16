import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { domains } = await request.json();

    if (!domains || domains.length === 0) {
      return NextResponse.json(
        { error: 'No domains provided' },
        { status: 400 }
      );
    }

    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    let totalNewUrls = 0;
    let processedSites = 0;
    let errors = [];

    for (const domainName of domains) {
      const site = await prisma.site.findUnique({
        where: { domainName },
      });

      if (!site) {
        console.log(`Site not found for domain: ${domainName}`);
        errors.push(`Site not found for domain: ${domainName}`);
        continue;
      }

      const excelPath = path.join(reportsDir, `${domainName}.xlsx`);
      console.log(`Processing file: ${excelPath}`);

      try {
        // Dosya varlığını kontrol et
        const fileStats = await fs.stat(excelPath);
        console.log(
          `File exists: ${fileStats.isFile()}, Size: ${fileStats.size} bytes`
        );

        // Excel dosyasını oku
        const workbook = xlsx.readFile(excelPath, { type: 'file' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(
          `Read ${data.length} rows from Excel file for ${domainName}`
        );

        const urls = data.map((row: any) => row.URL || row.url).filter(Boolean);

        const existingUrls = await prisma.uRL.findMany({
          where: { siteId: site.id },
          select: { url: true },
        });
        const existingUrlSet = new Set(existingUrls.map((u) => u.url));

        const newUrls = urls.filter((url) => !existingUrlSet.has(url));

        if (newUrls.length > 0) {
          const createdUrls = await prisma.uRL.createMany({
            data: newUrls.map((url: string) => ({
              url,
              siteId: site.id,
              reviewed: false,
            })),
          });
          totalNewUrls += createdUrls.count;
        }

        processedSites++;
        console.log(
          `Processed ${domainName}: Added ${newUrls.length} new URLs`
        );
      } catch (error) {
        console.error(`Error processing ${domainName}:`, error);
        errors.push(`Error processing ${domainName}: ${error.message}`);
        continue;
      }
    }

    return NextResponse.json({
      message: `Added ${totalNewUrls} new URLs across ${processedSites} sites.`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error during bulk URL add:', error);
    return NextResponse.json(
      { error: 'Error during bulk URL add', details: error.message },
      { status: 500 }
    );
  }
}
