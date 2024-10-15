'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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

  const NotReviewedURLs = () => (
    <div>
      <h2>Not Reviewed</h2>
      <ul>
        {urls
          .filter((url) => !url.reviewed)
          .map((url) => (
            <li key={url.id}>
              {url.url}
              <button onClick={() => handleReview(url.id)}>✓</button>
            </li>
          ))}
      </ul>
    </div>
  );

  const ReviewedURLs = () => (
    <div>
      <h2>Reviewed</h2>
      <ul>
        {urls
          .filter((url) => url.reviewed)
          .map((url) => (
            <li key={url.id}>{url.url}</li>
          ))}
      </ul>
    </div>
  );

  return (
    <div>
      <h1>URLs for {domain}</h1>
      <button onClick={loadURLsFromExcel}>Load URLs from Excel</button>
      <NotReviewedURLs />
      <ReviewedURLs />
    </div>
  );
};

export default URLsPage;
