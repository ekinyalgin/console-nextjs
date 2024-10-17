'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, BarChart2, MoveLeft } from 'lucide-react';
import { TableComponent, ExtendedColumn } from '@/components/TableComponent';
import { ExcelUrlsComponent } from './ExcelUrlsComponent';
// import { Row } from 'react-table';

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
  const [dbUrls, setDbUrls] = useState<DBURL[]>([]);
  const [reviewedUrls, setReviewedUrls] = useState<DBURL[]>([]);
  const [site, setSite] = useState<Site | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReviewedUrls, setShowReviewedUrls] = useState(false);

  const fetchSiteInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/sites/${domain}`);
      const data = await response.json();
      setSite(data);
    } catch (error) {
      console.error('Error fetching site info:', error);
      setError('Error fetching site info');
    }
  }, [domain]);

  const fetchDbUrls = useCallback(
    async (reviewed: boolean) => {
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
    },
    [domain]
  );

  useEffect(() => {
    fetchSiteInfo();
    fetchDbUrls(false);
  }, [fetchSiteInfo, fetchDbUrls]);

  const handleReview = useCallback(
    async (id: number, reviewed: boolean) => {
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
    },
    [fetchDbUrls]
  );

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

  const getStatsUrl = useCallback(
    (url: string) => {
      const lang = site?.languages[0]?.language.name.toLowerCase() || 'en';
      return `https://sr.toolsminati.com/analytics/organic/overview/?db=${lang}&q=${encodeURIComponent(url)}&searchType=subfolder`;
    },
    [site]
  );

  const formatUrl = useCallback((url: string) => {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '');
  }, []);

  const dbColumns: ExtendedColumn<DBURL>[] = useMemo(
    () => [
      {
        Header: 'Done',
        id: 'review',
        accessor: 'reviewed',
        className: 'text-center',
        headerClassName: 'w-1/12',
        Cell: ({ row }: { row: { original: DBURL } }) => (
          <button
            onClick={() =>
              handleReview(row.original.id, !row.original.reviewed)
            }
            className="p-2 hover:text-green-500 transition"
          >
            <Check strokeWidth="3" className="h-4 w-4" />
          </button>
        ),
      },
      {
        Header: 'URL',
        accessor: 'url',
        className: 'text-left',
        Cell: ({ value }: { value: unknown }) => (
          <Link
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {formatUrl(value as string)}
          </Link>
        ),
        headerClassName: 'w-5/12 text-left',
      },
      {
        Header: 'Stats',
        id: 'stats',
        accessor: 'id',
        className: '',
        headerClassName: 'w-2/12',
        Cell: ({ row }: { row: { original: DBURL } }) => (
          <Link
            href={getStatsUrl(row.original.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BarChart2 strokeWidth="3" className="h-4 w-4 mx-auto" />
          </Link>
        ),
      },
    ],
    [handleReview, formatUrl, getStatsUrl]
  );

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

      <ExcelUrlsComponent
        domain={domain}
        onUrlsAdded={() => fetchDbUrls(false)}
      />

      <div className="">
        <h2 className="text-lg font-bold mb-2 mt-4">Not Reviewed URLs</h2>
        <TableComponent
          columns={dbColumns}
          data={dbUrls}
          keyField="id"
          onDelete={handleDelete}
        />
        <Button
          onClick={() => {
            setShowReviewedUrls(!showReviewedUrls);
            if (!showReviewedUrls) fetchDbUrls(true);
          }}
          variant="outline"
          className="mt-8 mb-4"
        >
          {showReviewedUrls ? 'Hide Reviewed URLs' : 'Show Reviewed URLs'}
        </Button>
      </div>

      {showReviewedUrls && (
        <div>
          <h2 className="text-lg font-bold mb-2">Reviewed URLs</h2>
          <TableComponent
            columns={dbColumns}
            data={reviewedUrls}
            keyField="id"
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}
