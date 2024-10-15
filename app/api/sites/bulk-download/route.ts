import { NextResponse } from 'next/server';
import { downloadReport } from '../[domain]/download/download';
import { TransformStream } from 'stream/web';

interface SiteToDownload {
  domainName: string;
  language: string;
  monthlyVisitors: number;
}

export async function POST(request: Request) {
  const { sites } = await request.json();

  if (!Array.isArray(sites) || sites.length === 0) {
    return NextResponse.json(
      { error: 'Invalid sites data: Empty or not an array' },
      { status: 400 }
    );
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendStatus = async (status: string) => {
    await writer.write(encoder.encode(JSON.stringify({ status }) + '\n'));
  };

  (async () => {
    try {
      await sendStatus(`Starting bulk download for ${sites.length} sites`);
      for (const site of sites) {
        try {
          await sendStatus(`Starting download for ${site.domainName}`);
          const filePath = await downloadReport({
            domainName: site.domainName,
            language: site.language,
            monthlyVisitors: site.monthlyVisitors,
            onProgress: (message) =>
              sendStatus(`${site.domainName}: ${message}`),
          });
          await sendStatus(
            `Completed download for ${site.domainName}: ${filePath}`
          );
        } catch (error) {
          console.error(`Error processing ${site.domainName}:`, error);
          await sendStatus(
            `Error processing ${site.domainName}: ${error.message}`
          );
        }
      }

      await sendStatus('All downloads completed');
    } catch (error) {
      console.error('Error during bulk download:', error);
      await sendStatus(`Error during bulk download: ${error.message}`);
    } finally {
      await writer.close();
    }
  })();

  return new NextResponse(stream.readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
