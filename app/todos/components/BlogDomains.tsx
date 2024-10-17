import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface BlogDomainsProps {
  title: string;
}

export const BlogDomains: React.FC<BlogDomainsProps> = ({ title }) => {
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    const fetchDomains = async () => {
      const response = await fetch(
        `/api/todos/blog-domains?category=${encodeURIComponent(title)}`
      );
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    };
    fetchDomains();
  }, [title]);

  return (
    <div className="flex space-x-1 items-center">
      {domains.map((domain, index) => (
        <Link
          key={index}
          href={`/sites/${domain}`}
          className="flex items-center space-x-1 text-black"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      ))}
    </div>
  );
};
