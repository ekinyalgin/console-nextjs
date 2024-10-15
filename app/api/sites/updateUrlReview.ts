import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const { id, reviewed } = req.body;

    try {
      const updatedUrl = await prisma.uRL.update({
        where: { id },
        data: { reviewed },
      });

      res.status(200).json(updatedUrl);
    } catch (error) {
      console.error('Error updating URL review status:', error);
      res.status(500).json({ error: 'Error updating URL review status' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
