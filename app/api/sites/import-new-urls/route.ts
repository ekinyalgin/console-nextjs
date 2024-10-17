import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as xlsx from 'xlsx';
import fs from 'fs/promises';
import path from 'path';
import { Transform } from 'node:stream'; // node:stream kullanıyoruz

export async function POST() {
  const nodeStream = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk);
    },
  });

  const writer = nodeStream;
  const encoder = new TextEncoder();

  const sendStatus = async (status: string) => {
    writer.write(encoder.encode(JSON.stringify({ status }) + '\n'));
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
        } catch {
          continue; // Dosya mevcut değil, sonraki siteye geç
        }

        await sendStatus(`Processing ${site.domainName}...`);

        const fileBuffer = await fs.readFile(filePath);
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const data = xlsx.utils.sheet_to_json<Record<string, string>>(sheet);

        const urls = data
          .map((row: Record<string, string>) => row.URL || row.url)
          .filter(Boolean);

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

      // Hata type guard ile kontrol ediliyor
      if (error instanceof Error) {
        await sendStatus(`Error during import: ${error.message}`);
      } else {
        await sendStatus(`Unknown error during import: ${String(error)}`);
      }
    } finally {
      await writer.end();
    }
  })();

  // Node.js akışını ReadableStream'e dönüştürüyoruz
  const readableStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    },
  });

  return new NextResponse(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
