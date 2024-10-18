import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface BulkDownloadReportsProps {
  selectedItems: number[];
  sites: Site[];
}

interface Site {
  id: number;
  domainName: string;
  monthly: number;
  languages: { language: { id: number; name: string } }[];
}

export function BulkDownloadReports({
  selectedItems,
  sites,
}: BulkDownloadReportsProps) {
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleBulkDownload = async () => {
    try {
      setDownloadStatus('Starting bulk download...');

      const selectedSites = sites.filter((site) =>
        selectedItems.includes(site.id)
      );

      if (selectedSites.length === 0) {
        setDownloadStatus('No domains selected for download.');
        return;
      }

      const selectedDomains = selectedSites.map((site) => ({
        domainName: site.domainName,
        language: site.languages[0]?.language.name.toLowerCase() || 'en',
        monthlyVisitors: site.monthly,
      }));

      const response = await fetch('/api/sites/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sites: selectedDomains, concurrency: 4 }),
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
                  setDownloadStatus(data.status);
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }
          }
        }

        setDownloadStatus('Bulk download completed');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start bulk download');
      }
    } catch (error) {
      console.error('Error during bulk download:', error);
      if (error instanceof Error) {
        setDownloadStatus(`Error: ${error.message}`);
      } else {
        setDownloadStatus('An unknown error occurred');
      }
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={handleBulkDownload}
        variant="outline"
        disabled={selectedItems.length === 0}
      >
        Download Reports ({selectedItems.length})
      </Button>
      {downloadStatus && (
        <p className="absolute top-10 text-xs">{downloadStatus}</p>
      )}
    </div>
  );
}
