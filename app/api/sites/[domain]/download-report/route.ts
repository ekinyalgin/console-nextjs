import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { downloadReport } from '../download/download';
import { Transform } from 'node:stream';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;

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
      const site = await prisma.site.findUnique({
        where: { domainName: domain },
        include: {
          languages: {
            include: {
              language: true,
            },
          },
        },
      });

      if (!site) {
        await sendStatus('Site not found');
        writer.end(); // stream'i kapat
        return;
      }

      const language = site.languages[0]?.language.name.toLowerCase() || 'en';

      await downloadReport({
        domainName: domain,
        language,
        monthlyVisitors: site.monthly,
        onProgress: sendStatus,
      });

      await sendStatus('Report downloaded successfully');
      writer.end(); // stream'i kapat
    } catch (error) {
      console.error('Error downloading report:', error);
      await sendStatus('Error downloading report');
      writer.end(); // stream'i kapat
    }
  })();

  // Node.js akışını bir tarayıcı `ReadableStream`'ine dönüştürün
  const readableStream = new ReadableStream({
    async start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        console.error('Stream error:', err);
        controller.error(err);
      });
    },
  });

  return new NextResponse(readableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
