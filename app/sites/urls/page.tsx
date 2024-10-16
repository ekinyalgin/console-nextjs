'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TableComponent } from '@/components/TableComponent';
import { Column } from 'react-table';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface URL {
  id: number;
  url: string;
  domainName: string;
  reviewed: boolean;
}

const URLsPage = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [urls, setUrls] = useState<URL[]>([]);

  useEffect(() => {
    fetchUrls();
  }, [domain]);

  const fetchUrls = async () => {
    try {
      const response = await fetch(`/api/sites/${domain}/urls`);
      const data = await response.json();
      setUrls(data);
    } catch (error) {
      console.error('Error fetching URLs:', error);
    }
  };

  const loadURLsFromExcel = async () => {
    try {
      const response = await fetch(`/api/sites/loadExcel?domain=${domain}`);
      const newUrls = await response.json();
      setUrls(newUrls);
    } catch (error) {
      console.error('Error loading URLs from Excel:', error);
    }
  };

  const handleReview = async (id: number) => {
    try {
      const response = await fetch('/api/sites/updateUrlReview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reviewed: true }),
      });

      if (response.ok) {
        setUrls(
          urls.map((url) => (url.id === id ? { ...url, reviewed: true } : url))
        );
      }
    } catch (error) {
      console.error('Error updating URL review status:', error);
    }
  };

  const columns: Column<URL>[] = [
    {
      Header: 'URL',
      accessor: 'url',
    },
    {
      Header: 'Status',
      accessor: 'reviewed',
      Cell: ({ value }) => (value ? 'Reviewed' : 'Not Reviewed'),
    },
    {
      Header: 'Action',
      id: 'action',
      Cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleReview(row.original.id)}
          disabled={row.original.reviewed}
        >
          <Check className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">URLs for {domain}</h1>
      <Button onClick={loadURLsFromExcel} className="mb-4">
        Load URLs from Excel
      </Button>
      <TableComponent columns={columns} data={urls} keyField="id" />
    </div>
  );
};

export default URLsPage;
