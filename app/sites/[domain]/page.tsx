'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, BarChart2, MoveLeft, X } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface ExcelURL {
  url: string;
  added: boolean;
  title?: string;
}

interface DBURL {
  id: number;
  url: string;
  reviewed: boolean;
  title?: string;
}

interface Site {
  id: number;
  domainName: string;
  languages: { language: { name: string } }[];
}

export default function DomainPage() {
  const params = useParams();
  const domain = params.domain as string;
  const [excelUrls, setExcelUrls] = useState<ExcelURL[]>([]);
  const [dbUrls, setDbUrls] = useState<DBURL[]>([]);
  const [reviewedUrls, setReviewedUrls] = useState<DBURL[]>([]);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExcelUrls, setShowExcelUrls] = useState(false);
  const [showReviewedUrls, setShowReviewedUrls] = useState(false);
  const [hasExcelFile, setHasExcelFile] = useState(false);

  useEffect(() => {
    fetchSiteInfo();
    fetchDbUrls(false);
    checkExcelFile();
  }, [domain]);

  const fetchSiteInfo = async () => {
    try {
      const response = await fetch(`/api/sites/${domain}`);
      const data = await response.json();
      setSite(data);
    } catch (error) {
      console.error('Error fetching site info:', error);
      setError('Error fetching site info');
    }
  };

  const loadExcelUrls = async () => {
    try {
      const response = await fetch(`/api/sites/load-excel?domain=${domain}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const newExcelUrls = data
          .filter((url) => !dbUrls.some((dbUrl) => dbUrl.url === url))
          .map((url) => ({ url, added: false }));
        setExcelUrls(newExcelUrls);
      } else {
        console.error('Unexpected data format:', data);
        setError('Unexpected data format received from server');
      }
    } catch (error) {
      console.error('Error loading Excel URLs:', error);
      setError('Error loading Excel URLs');
    }
  };

  const addUrlToDatabase = async (url: string) => {
    try {
      const response = await fetch('/api/sites/add-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, domain }),
      });
      if (response.ok) {
        setExcelUrls((prevUrls) => prevUrls.filter((u) => u.url !== url));
        fetchDbUrls(false);
      } else {
        throw new Error('Failed to add URL');
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      setError('Error adding URL to database');
    }
  };

  const addAllUrlsToDatabase = async () => {
    try {
      const response = await fetch('/api/sites/add-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: excelUrls.map((u) => u.url), domain }),
      });
      if (response.ok) {
        // Excel dosyasını sil
        const deleteResponse = await fetch(
          `/api/sites/${domain}/delete-excel`,
          {
            method: 'DELETE',
          }
        );
        if (deleteResponse.ok) {
          setExcelUrls([]);
          fetchDbUrls(false);
          setShowExcelUrls(false);
        } else {
          throw new Error('Failed to delete Excel file');
        }
      } else {
        throw new Error('Failed to add URLs');
      }
    } catch (error) {
      console.error('Error adding URLs:', error);
      setError('Error adding URLs to database or deleting Excel file');
    }
  };

  const fetchDbUrls = async (reviewed: boolean) => {
    try {
      const response = await fetch(
        `/api/sites/${domain}/urls?reviewed=${reviewed}`
      );
      const data = await response.json();
      if (reviewed) {
        setReviewedUrls(data);
      } else {
        setDbUrls(data);
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
      setError('Error fetching URLs');
    }
  };

  const handleReview = async (id: number, reviewed: boolean) => {
    try {
      const response = await fetch('/api/sites/update-url-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, reviewed }),
      });
      if (response.ok) {
        fetchDbUrls(false);
      } else {
        throw new Error('Failed to update URL review status');
      }
    } catch (error) {
      console.error('Error updating URL review status:', error);
      setError('Error updating URL review status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/sites/${domain}/urls/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchDbUrls(false);
      } else {
        throw new Error('Failed to delete URL');
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
      setError('Error deleting URL');
    }
  };

  const getStatsUrl = (url: string) => {
    const lang = site?.languages[0]?.language.name.toLowerCase() || 'en';
    return `https://sr.toolsminati.com/analytics/organic/overview/?db=${lang}&q=${encodeURIComponent(url)}&searchType=subfolder`;
  };

  const formatUrl = (url: string) => {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '');
  };

  const excelColumns: ColumnDef<ExcelURL>[] = [
    {
      id: 'add',
      header: 'Add',
      cell: ({ row }) => (
        <button
          onClick={() => addUrlToDatabase(row.original.url)}
          className="p-2 hover:text-green-500 transition"
        >
          <Check strokeWidth="3" className="h-4 w-4" />
        </button>
      ),
      headerClassName: 'w-1/12',
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <Link
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {formatUrl(row.original.url)}
        </Link>
      ),
      headerClassName: 'grow-1 text-left',
      cellClassName: 'text-left text-black',
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <Link
          href={getStatsUrl(row.original.url)}
          target="_blank"
          rel="noopener noreferrer"
          className=""
        >
          <BarChart2 strokeWidth="3" className="h-4 w-4 mx-auto" />
        </Link>
      ),
      cellClassName: 'text-orange-600',
      headerClassName: 'w-1/12',
    },
  ];

  const dbColumns: ColumnDef<DBURL>[] = [
    {
      id: 'review',
      header: 'Done',
      cell: ({ row }) => (
        <button
          onClick={() => handleReview(row.original.id, !row.original.reviewed)}
          className="p-2 hover:text-green-500 transition"
        >
          <Check strokeWidth="3" className="h-4 w-4" />
        </button>
      ),
      headerClassName: 'w-1/12',
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <Link
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {formatUrl(row.original.url)}
        </Link>
      ),
      headerClassName: 'grow-1 text-left',
      cellClassName: 'text-left text-black font-semibold tracking-normal',
    },
    {
      accessorKey: 'stats',
      header: 'Stats',
      cell: ({ row }) => (
        <Link
          href={getStatsUrl(row.original.url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <BarChart2 strokeWidth="3" className="h-4 w-4 mx-auto" />
        </Link>
      ),
      cellClassName: 'text-orange-600',
      headerClassName: 'w-1/12',
    },
  ];

  const checkExcelFile = async () => {
    try {
      const response = await fetch(`/api/sites/check-excel?domain=${domain}`);
      const data = await response.json();
      setHasExcelFile(data.exists);
    } catch (error) {
      console.error('Error checking Excel file:', error);
      setError('Error checking Excel file');
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-2">
        <Link href="/sites">
          <MoveLeft strokeWidth="2" className="w-6 text-black" />
        </Link>
        <h1 className="text-2xl font-bold my-6">URLs for {domain}</h1>
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button
            onClick={() => {
              setShowExcelUrls(!showExcelUrls);
              if (!showExcelUrls) loadExcelUrls();
            }}
            variant="outline"
            disabled={!hasExcelFile}
            className={!hasExcelFile ? 'cursor-not-allowed opacity-50' : ''}
          >
            {showExcelUrls ? 'Hide Excel URLs' : 'Show Excel URLs'}
          </Button>
          <Button
            onClick={addAllUrlsToDatabase}
            variant="secondary"
            disabled={!showExcelUrls || excelUrls.length === 0}
            className={
              !showExcelUrls || excelUrls.length === 0
                ? 'cursor-not-allowed opacity-50'
                : ''
            }
          >
            Add All URLs and Delete Excel
          </Button>
        </div>
        <Button
          onClick={() => {
            setShowReviewedUrls(!showReviewedUrls);
            if (!showReviewedUrls) fetchDbUrls(true);
          }}
          variant="outline"
        >
          {showReviewedUrls ? 'Hide Reviewed URLs' : 'Show Reviewed URLs'}
        </Button>
      </div>

      {showExcelUrls && (
        <div className="mb-8">
          {excelUrls.length > 0 ? (
            <DataTable columns={excelColumns} data={excelUrls} keyField="url" />
          ) : (
            <p className="bg-gray-50 shadow-sm rounded-sm border text-center py-3 text-sm border-gray-100">
              No new URLs found in the Excel file.
            </p>
          )}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2 mt-4">Not Reviewed URLs</h2>
        <DataTable
          columns={dbColumns}
          data={dbUrls}
          keyField="id"
          onDelete={handleDelete}
          showEditAction={false}
          showDeleteAction={true}
        />
      </div>

      {showReviewedUrls && (
        <div>
          <h2 className="text-lg font-bold mb-2">Reviewed URLs</h2>
          <DataTable
            columns={dbColumns}
            data={reviewedUrls}
            keyField="id"
            onDelete={handleDelete}
            showEditAction={false}
            showDeleteAction={true}
          />
        </div>
      )}
    </div>
  );
}
