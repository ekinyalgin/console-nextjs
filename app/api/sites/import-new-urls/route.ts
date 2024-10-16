import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import { TransformStream } from 'stream/web';

export async function POST() {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendStatus = async (status: string) => {
    await writer.write(encoder.encode(JSON.stringify({ status }) + '\n'));
  };

  (async () => {
    try {
      const sites = await prisma.site.findMany({
        include: { categories: { include: { category: true } } },
      });

      for (const site of sites) {
        const fileName = `${site.domainName}.xlsx`;
        const filePath = path.join(
          process.cwd(),
          'public',
          'reports',
          fileName
        );

        try {
          await fs.access(filePath);
        } catch (error) {
          continue; // File doesn't exist, skip to next site
        }

        await sendStatus(`Processing ${site.domainName}...`);

        const fileBuffer = await fs.readFile(filePath);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const urls = data.map((row: any) => row.URL || row.url).filter(Boolean);

        for (const url of urls) {
          const existingUrl = await prisma.uRL.findFirst({
            where: { url, siteId: site.id },
          });

          if (!existingUrl) {
            await prisma.uRL.create({
              data: {
                url,
                siteId: site.id,
                reviewed: false,
              },
            });
          }
        }

        await fs.unlink(filePath);
        await sendStatus(`Processed and deleted ${fileName}`);
      }

      await sendStatus('All sites processed');
    } catch (error) {
      console.error('Error during import:', error);
      await sendStatus(`Error during import: ${error.message}`);
    } finally {
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
