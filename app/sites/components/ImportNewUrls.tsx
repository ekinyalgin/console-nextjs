'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const ImportNewUrls: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState('');
  const router = useRouter();

  const handleImport = async () => {
    setIsImporting(true);
    setStatus('Starting import...');

    try {
      const response = await fetch('/api/sites/import-new-urls', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        lines.forEach((line) => {
          if (line) {
            const { status } = JSON.parse(line);
            setStatus(status);
          }
        });
      }

      setStatus('Import completed successfully');
      router.refresh();
    } catch (error) {
      console.error('Error during import:', error);
      setStatus('Error during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleImport}
        disabled={isImporting}
        variant="outline"
        className=""
      >
        {isImporting ? 'Importing...' : 'Import New URLs'}
      </Button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
};

export default ImportNewUrls;
