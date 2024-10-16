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

    for (const domainName of domains) {
      const site = await prisma.site.findUnique({
        where: { domainName },
      });

      if (!site) {
        console.log(`Site not found for domain: ${domainName}`);
        continue;
      }

      const excelPath = path.join(reportsDir, `${domainName}.xlsx`);
      console.log(`Processing file: ${excelPath}`);

      try {
        // Dosya erişimini kontrol et
        await fs.access(excelPath, fs.constants.R_OK | fs.constants.W_OK);
        console.log(`File access successful for ${excelPath}`);

        // Excel dosyasını oku
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log(`Read ${data.length} rows from Excel file`);

        const urls = data.map((row: any) => row.URL || row.url).filter(Boolean);

        // Mevcut URL'leri al
        const existingUrls = await prisma.uRL.findMany({
          where: { siteId: site.id },
          select: { url: true },
        });
        const existingUrlSet = new Set(existingUrls.map((u) => u.url));
        console.log(`Found ${existingUrls.length} existing URLs in database`);

        // Yeni URL'leri filtrele ve ekle
        const newUrls = urls.filter((url) => !existingUrlSet.has(url));
        console.log(`Filtered ${newUrls.length} new URLs to add`);

        if (newUrls.length > 0) {
          const createdUrls = await prisma.uRL.createMany({
            data: newUrls.map((url: string) => ({
              url,
              siteId: site.id,
              reviewed: false,
            })),
          });
          console.log(`Added ${createdUrls.count} new URLs to database`);
          totalNewUrls += createdUrls.count;
        }

        processedSites++;
        console.log(
          `Processed ${domainName}: Added ${newUrls.length} new URLs`
        );
      } catch (error) {
        console.error(`Error processing ${domainName}:`, error);
        // Hata durumunda bu siteyi atla ve bir sonrakine geç
        continue;
      }
    }

    return NextResponse.json({
      message: `Bulk add completed. Added ${totalNewUrls} new URLs across ${processedSites} sites.`,
    });
  } catch (error) {
    console.error('Error during bulk add:', error);
    return NextResponse.json(
      { error: 'Error during bulk add' },
      { status: 500 }
    );
  }
}
