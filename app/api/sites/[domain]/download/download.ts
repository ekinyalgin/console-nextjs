import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

interface DownloadReportParams {
  domainName: string;
  language: string;
  monthlyVisitors: number;
  onProgress: (message: string) => void;
}

export async function downloadReport({
  domainName,
  language,
  monthlyVisitors,
  onProgress,
}: DownloadReportParams): Promise<string> {
  onProgress('Starting download process...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  try {
    onProgress('Logging in...');
    await page.goto('https://app.toolsminati.com/login', {
      waitUntil: 'networkidle',
    });

    await page.fill('#amember-login', 'ekinyalgin@gmail.com');
    await page.fill('#amember-pass', 'qhunxciitm');
    await page.click('input[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle' });

    onProgress('Navigating to data page...');
    const previousMonth = getPreviousMonth();
    const targetUrl = `https://sr.toolsminati.com/analytics/organic/pages/?filter=%7B%22search%22%3A%22%22%2C%22intentPositions%22%3A%5B%5D%2C%22advanced%22%3A%7B%220%22%3A%7B%22inc%22%3Atrue%2C%22fld%22%3A%22tf%22%2C%22cri%22%3A%22%3E%22%2C%22val%22%3A${monthlyVisitors}%7D%7D%7D&db=${language}&q=${domainName}&searchType=domain&date=${previousMonth}`;
    await page.goto(targetUrl, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    onProgress('Exporting data...');
    await page.click('button[aria-label="Export organic pages data"]');
    await page.waitForTimeout(10000);

    onProgress('Downloading file...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text="Excel"'),
    ]);

    const downloadPath = path.join(PUBLIC_DIR, 'reports');
    const fileName = `${domainName}.xlsx`;
    const filePath = path.join(downloadPath, fileName);

    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      onProgress('Existing file deleted');
    }

    await download.saveAs(filePath);
    onProgress('Download completed');
    return filePath;
  } catch (error) {
    console.error('Error during the process:', error);
    onProgress('Error during download');
    throw error;
  } finally {
    await browser.close();
  }
}

function getPreviousMonth(): string {
  const today = new Date();
  const firstDayOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const lastDayOfPreviousMonth = new Date(firstDayOfCurrentMonth.getTime() - 1);
  return lastDayOfPreviousMonth.toISOString().slice(0, 7).replace('-', '');
}
