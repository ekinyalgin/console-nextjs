import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Download, FileDown, Trash } from 'lucide-react';
import Link from 'next/link';

interface SiteListProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: number) => void;
  onSelect: (selectedItems: number[]) => void;
  selectedItems: number[];
}

interface Site {
  id: number;
  domainName: string;
  monthly: number;
  categories: { category: { id: number; name: string } }[];
  languages: { language: { id: number; name: string } }[];
}

export function SiteList({
  sites,
  onEdit,
  onDelete,
  onSelect,
  selectedItems,
}: SiteListProps) {
  const [downloadStatus, setDownloadStatus] = useState<{
    [key: string]: string;
  }>({});
  const [siteStatuses, setSiteStatuses] = useState<{
    [key: string]: { hasExcel: boolean; hasNotReviewedUrls: boolean };
  }>({});

  const checkSiteStatus = useCallback(async (domainName: string) => {
    try {
      const excelResponse = await fetch(
        `/api/sites/check-excel?domain=${domainName}`
      );
      const excelData = await excelResponse.json();

      const urlsResponse = await fetch(
        `/api/sites/${domainName}/urls?reviewed=false`
      );
      const urlsData = await urlsResponse.json();

      setSiteStatuses((prev) => ({
        ...prev,
        [domainName]: {
          hasExcel: excelData.exists,
          hasNotReviewedUrls: urlsData.length > 0,
        },
      }));
    } catch (error) {
      console.error('Error checking site status:', error);
    }
  }, []);

  useEffect(() => {
    sites.forEach((site) => {
      checkSiteStatus(site.domainName);
    });
  }, [sites, checkSiteStatus]);

  const handleDownload = async (domainName: string) => {
    try {
      setDownloadStatus({
        ...downloadStatus,
        [domainName]: 'Starting download process...',
      });
      const response = await fetch(`/api/sites/${domainName}/download-report`);

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          try {
            const data = JSON.parse(chunk);
            if (data.status) {
              setDownloadStatus((prev) => ({
                ...prev,
                [domainName]: data.status,
              }));
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }

        setDownloadStatus((prev) => ({
          ...prev,
          [domainName]: 'Download completed. Processing data...',
        }));

        // Simulating some processing time
        setTimeout(() => {
          setDownloadStatus((prev) => ({
            ...prev,
            [domainName]: 'Data processed and ready for use.',
          }));
          checkSiteStatus(domainName);
        }, 2000);
      } else {
        throw new Error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setDownloadStatus({
        ...downloadStatus,
        [domainName]: 'Error occurred during download. Please try again.',
      });
    }
  };

  const handleBulkDownload = async () => {
    try {
      setDownloadStatus({ bulk: 'Starting bulk download...' });
      const selectedDomains = sites
        .filter((site) => selectedItems.includes(site.id))
        .map((site) => ({
          domainName: site.domainName,
          language: site.languages[0]?.language.name.toLowerCase() || 'en',
          monthlyVisitors: site.monthly,
        }));

      if (selectedDomains.length === 0) {
        setDownloadStatus({ bulk: 'No domains selected for download.' });
        return;
      }

      console.log('Selected domains:', selectedDomains); // Debug için

      const response = await fetch('/api/sites/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites: selectedDomains }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line) {
              try {
                const data = JSON.parse(line);
                if (data.status) {
                  setDownloadStatus((prev) => ({ ...prev, bulk: data.status }));
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }

        setDownloadStatus((prev) => ({
          ...prev,
          bulk: 'Bulk download completed',
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start bulk download');
      }
    } catch (error) {
      console.error('Error during bulk download:', error);
      setDownloadStatus((prev) => ({
        ...prev,
        bulk: `Error: ${error.message}`,
      }));
    }
  };

  const handleBulkAddAndDelete = async () => {
    try {
      setDownloadStatus({ bulkAdd: 'Starting bulk add and delete...' });
      const response = await fetch('/api/sites/bulk-add-and-delete', {
        method: 'POST',
      });

      if (response.ok) {
        setDownloadStatus({ bulkAdd: 'Bulk add and delete completed' });
        // Refresh site statuses
        sites.forEach((site) => checkSiteStatus(site.domainName));
      } else {
        throw new Error('Failed to start bulk add and delete');
      }
    } catch (error) {
      console.error('Error starting bulk add and delete:', error);
      setDownloadStatus({ bulkAdd: 'Error during bulk add and delete' });
    }
  };

  const handleSelectChange = (newSelectedItems: number[]) => {
    console.log('Selected Items:', newSelectedItems);
    onSelect(newSelectedItems);
  };

  const columns: ColumnDef<Site>[] = [
    {
      accessorKey: 'domainName',
      header: 'Domain Name',
      cell: ({ row }) => (
        <div>
          <Link
            href={`/sites/${row.original.domainName}`}
            className={` hover:underline ${
              siteStatuses[row.original.domainName]?.hasNotReviewedUrls
                ? 'text-blue-600 underline'
                : siteStatuses[row.original.domainName]?.hasExcel
                  ? ''
                  : 'font-normal text-black'
            }`}
          >
            {row.original.domainName}
          </Link>
          {downloadStatus[row.original.domainName] && (
            <div className="text-xs text-gray-400 font-normal">
              {downloadStatus[row.original.domainName]}
            </div>
          )}
        </div>
      ),
      headerClassName: 'w-5/12 text-left',
      cellClassName: 'text-left font-semibold',
    },
    {
      accessorKey: 'monthly',
      header: 'Monthly',
      cellClassName: 'text-xs text-center tracking-wider',
    },
    {
      accessorKey: 'languages',
      header: 'Languages',
      cell: ({ row }) => (
        <div>
          {row.original.languages.map((l) => l.language.name).join(', ')}
        </div>
      ),
      cellClassName: 'text-xs text-center tracking-wider',
    },
    {
      id: 'download',
      header: 'DL',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDownload(row.original.domainName)}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
      cellClassName: 'text-center',
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={sites}
        keyField="id"
        onEdit={onEdit}
        onDelete={onDelete}
        selectable={true}
        selectedItems={selectedItems}
        onSelectChange={handleSelectChange}
      />
      <div className="mt-4 space-x-2">
        <Button
          onClick={handleBulkDownload}
          disabled={selectedItems.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Download Selected Reports ({selectedItems.length})
        </Button>
        <Button onClick={handleBulkAddAndDelete}>
          <Trash className="mr-2 h-4 w-4" />
          Add URLs and Delete Excel Files
        </Button>
      </div>
      {downloadStatus.bulk && (
        <p className="mt-2 text-sm">{downloadStatus.bulk}</p>
      )}
      {downloadStatus.bulkAdd && (
        <p className="mt-2 text-sm">{downloadStatus.bulkAdd}</p>
      )}
    </>
  );
}
