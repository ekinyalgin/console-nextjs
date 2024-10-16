import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { Check, FileText, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export const columns: ColumnDef<any>[] = [
  {
    id: 'check',
    header: 'Done',
    cell: ({ row }) => {
      const [checked, setChecked] = useState(false);

      const handleIconClick = async () => {
        setChecked((prev) => !prev); // Görseli hemen güncelle
        await row.original.onCheckClick(row.original.id); // Sonra API'yi tetikle
      };

      return (
        <Check
          strokeWidth={3}
          className={`mx-auto w-4 cursor-pointer`}
          onClick={handleIconClick}
        />
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    headerClassName: 'w-5/12 text-left',
    cellClassName: 'text-left font-semibold',
  },
  {
    accessorKey: 'date',
    header: 'Date',
    headerClassName: '',
    cellClassName: 'text-xs',
    cell: ({ row }) => format(parseISO(row.original.date), 'dd/MM/yyyy'),
  },
  {
    id: 'note',
    header: 'Note',
    headerClassName: 'w-1/12',
    cell: ({ row }) => {
      const [showNote, setShowNote] = useState(false);
      if (!row.original.note) return null;
      return (
        <>
          <FileText
            className="w-4 mx-auto cursor-pointer"
            onClick={() => setShowNote(!showNote)}
          />
          {showNote && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-2 bg-gray-100">
                <div className="text-sm text-gray-500">{row.original.note}</div>
              </td>
            </tr>
          )}
        </>
      );
    },
  },
  {
    accessorKey: 'links',
    header: 'Links',
    headerClassName: 'text-left w-2/12',
    cell: ({ row }) => (
      <div className="flex space-x-2">
        {row.original.links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div
              dangerouslySetInnerHTML={{ __html: link.icon }}
              className="w-6 h-6"
            />
          </a>
        ))}
      </div>
    ),
  },
  {
    id: 'blog',
    header: 'Blog',
    headerClassName: 'text-left w-2/12',
    cell: ({ row }) => {
      const [domains, setDomains] = useState([]);

      useEffect(() => {
        const fetchDomains = async () => {
          const response = await fetch(
            `/api/todos/blog-domains?category=${encodeURIComponent(row.original.title)}`
          );
          if (response.ok) {
            const data = await response.json();
            setDomains(data);
          }
        };
        fetchDomains();
      }, [row.original.title]);

      return (
        <div className="flex space-x-1 items-center">
          {domains.map((domain, index) => (
            <Link
              key={index}
              href={`/sites/${domain}`}
              className="flex items-center space-x-1 text-black"
            >
              <ArrowRight className="w-4 w-4" />
            </Link>
          ))}
        </div>
      );
    },
  },
];
