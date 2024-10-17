import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TableComponent, ExtendedColumn } from '@/components/TableComponent';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface ExcelURL {
  url: string;
  added: boolean;
}

interface ExcelUrlsComponentProps {
  domain: string;
  onUrlsAdded: () => void;
}

export function ExcelUrlsComponent({
  domain,
  onUrlsAdded,
}: ExcelUrlsComponentProps) {
  const [excelUrls, setExcelUrls] = useState<ExcelURL[]>([]);
  const [showExcelUrls, setShowExcelUrls] = useState(false);
  const [hasExcelFile, setHasExcelFile] = useState(false);

  const checkExcelFile = useCallback(async () => {
    try {
      const response = await fetch(`/api/sites/check-excel?domain=${domain}`);
      const data = await response.json();
      setHasExcelFile(data.exists);
    } catch (error) {
      console.error('Error checking Excel file:', error);
    }
  }, [domain]);

  useEffect(() => {
    checkExcelFile();
  }, [domain, checkExcelFile]);

  const loadExcelUrls = async () => {
    try {
      const response = await fetch(`/api/sites/load-excel?domain=${domain}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        // Veritabanındaki URL'leri al
        const dbUrlsResponse = await fetch(`/api/sites/${domain}/urls`);
        const dbUrls = await dbUrlsResponse.json();
        // Veritabanındaki URL'leri al
        const dbUrlSet = new Set(dbUrls.map((url: { url: string }) => url.url));

        // Sadece veritabanında olmayan URL'leri filtrele
        const newExcelUrls = data
          .filter((url) => !dbUrlSet.has(url))
          .map((url) => ({ url, added: false }));
        setExcelUrls(newExcelUrls);
      } else {
        console.error('Unexpected data format:', data);
      }
    } catch (error) {
      console.error('Error loading Excel URLs:', error);
    }
  };

  const addUrlToDatabase = useCallback(
    async (url: string) => {
      try {
        const response = await fetch('/api/sites/add-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, domain }),
        });
        if (response.ok) {
          setExcelUrls((prevUrls) => prevUrls.filter((u) => u.url !== url));
          onUrlsAdded();
        } else {
          throw new Error('Failed to add URL');
        }
      } catch (error) {
        console.error('Error adding URL:', error);
      }
    },
    [domain, onUrlsAdded]
  );

  const addAllUrlsToDatabase = async () => {
    try {
      const response = await fetch('/api/sites/add-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: excelUrls.map((u) => u.url), domain }),
      });
      if (response.ok) {
        const deleteResponse = await fetch(
          `/api/sites/${domain}/delete-excel`,
          {
            method: 'DELETE',
          }
        );
        if (deleteResponse.ok) {
          setExcelUrls([]);
          setShowExcelUrls(false);
          setHasExcelFile(false);
          onUrlsAdded();
        } else {
          throw new Error('Failed to delete Excel file');
        }
      } else {
        throw new Error('Failed to add URLs');
      }
    } catch (error) {
      console.error('Error adding URLs:', error);
    }
  };

  const formatUrl = (url: string) => {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '');
  };

  const excelColumns: ExtendedColumn<ExcelURL>[] = useMemo(
    () => [
      {
        Header: 'Add',
        id: 'add',
        accessor: 'added', // Burada 'added' özelliğini kullanıyoruz
        className: 'text-center',
        headerClassName: 'text-center w-1/12',
        Cell: ({ row }) => (
          <button
            onClick={() => addUrlToDatabase(row.original.url)}
            className="p-2 hover:text-green-500 transition "
          >
            <Check strokeWidth="3" className="h-4 w-4 " />
          </button>
        ),
      },
      {
        Header: 'URL',
        accessor: 'url',
        className: 'text-left',
        headerClassName: 'text-left w-5/12',
        Cell: ({ value }: { value: unknown }) => (
          <Link
            href={value as string}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {formatUrl(value as string)}
          </Link>
        ),
      },
    ],
    [addUrlToDatabase]
  );

  return (
    <div className="mb-8">
      <div className="space-x-2 mb-4">
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

      {showExcelUrls && (
        <div>
          {excelUrls.length > 0 ? (
            <TableComponent
              columns={excelColumns}
              data={excelUrls}
              keyField="url"
            />
          ) : (
            <p className="bg-gray-50 shadow-sm rounded-sm border text-center py-3 text-sm border-gray-100">
              No new URLs found in the Excel file.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
