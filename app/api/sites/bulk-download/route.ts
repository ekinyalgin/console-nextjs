import { NextResponse } from 'next/server';
import { downloadReport } from '../[domain]/download/download';
import { Transform } from 'node:stream'; // node:stream modülü kullanıyoruz

export async function POST(request: Request) {
  const { sites, concurrency = 4 } = await request.json();

  if (!Array.isArray(sites) || sites.length === 0) {
    return NextResponse.json(
      { error: 'Invalid sites data: Empty or not an array' },
      { status: 400 }
    );
  }

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
      await sendStatus(
        `Starting bulk download for ${sites.length} sites with concurrency ${concurrency}`
      );

      const queue = [...sites];
      const activeDownloads = new Set();
      const results = [];

      while (queue.length > 0 || activeDownloads.size > 0) {
        while (activeDownloads.size < concurrency && queue.length > 0) {
          const site = queue.shift();
          const downloadPromise = downloadReport({
            domainName: site.domainName,
            language: site.language,
            monthlyVisitors: site.monthlyVisitors,
            onProgress: (message) =>
              sendStatus(`${site.domainName}: ${message}`),
          })
            .then((filePath) => {
              activeDownloads.delete(downloadPromise);
              return { domainName: site.domainName, filePath };
            })
            .catch((error) => {
              activeDownloads.delete(downloadPromise);
              return { domainName: site.domainName, error: error.message };
            });

          activeDownloads.add(downloadPromise);
          results.push(downloadPromise);
        }

        if (activeDownloads.size > 0) {
          await Promise.race(activeDownloads);
        }
      }

      const finalResults = await Promise.all(results);
      for (const result of finalResults) {
        if ('error' in result) {
          await sendStatus(
            `Error processing ${result.domainName}: ${result.error}`
          );
        } else {
          await sendStatus(
            `Completed download for ${result.domainName}: ${result.filePath}`
          );
        }
      }

      await sendStatus('All downloads completed');
    } catch (error) {
      console.error('Error during bulk download:', error);

      if (error instanceof Error) {
        await sendStatus(`Error during bulk download: ${error.message}`);
      } else {
        await sendStatus(`Error during bulk download: ${String(error)}`);
      }
    } finally {
      await writer.end();
    }
  })();

  // Node.js akışını `ReadableStream` ile sarıyoruz
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
