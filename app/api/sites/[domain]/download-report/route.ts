import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { downloadReport } from '../download/download';
import { TransformStream } from 'stream/web';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domain = params.domain;

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendStatus = async (status: string) => {
    await writer.write(encoder.encode(JSON.stringify({ status }) + '\n'));
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
        await writer.close();
        return;
      }

      const language = site.languages[0]?.language.name.toLowerCase() || 'en';

      const filePath = await downloadReport({
        domainName: domain,
        language,
        monthlyVisitors: site.monthly,
        onProgress: sendStatus,
      });

      await sendStatus('Report downloaded successfully');
      await writer.close();
    } catch (error) {
      console.error('Error downloading report:', error);
      await sendStatus('Error downloading report');
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
