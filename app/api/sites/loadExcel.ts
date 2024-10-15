import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import xlsx from 'xlsx';
import path from 'path';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { domain } = req.query;

    try {
      const filePath = path.join(
        process.cwd(),
        'public',
        'reports',
        `${domain}.xlsx`
      );
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);

      const urls = await Promise.all(
        data.map(async (row: any) => {
          return await prisma.uRL.upsert({
            where: {
              url_domainName: { url: row.url, domainName: domain as string },
            },
            update: {},
            create: { url: row.url, domainName: domain as string },
          });
        })
      );

      res.status(200).json(urls);
    } catch (error) {
      console.error('Error loading Excel file:', error);
      res.status(500).json({ error: 'Error loading Excel file' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
