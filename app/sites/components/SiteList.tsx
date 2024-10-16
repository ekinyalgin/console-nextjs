'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TableComponent } from '@/components/TableComponent';
import { Column } from 'react-table';
import { Button } from '@/components/ui/button';
import { Download, FileDown, Trash, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SiteForm } from './SiteForm';
import { BulkUpdateVisitors } from './BulkUpdateVisitors';
import Notification from '@/components/Notification';
import { Checkbox } from '@/components/ui/checkbox';
import { CategoryTabs } from './CategoryTabs';
import { BulkDownloadReports } from './BulkDownloadReports';

interface Site {
  id: number;
  domainName: string;
  monthly: number;
  categories: { category: { id: number; name: string } }[];
  languages: { language: { id: number; name: string } }[];
}

interface SiteCategories {
  id: number;
  name: string;
}

interface SiteLanguages {
  id: number;
  name: string;
}

export default function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<SiteCategories[]>([]);
  const [languages, setLanguages] = useState<SiteLanguages[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<{
    [key: string]: string;
  }>({});
  const [siteStatuses, setSiteStatuses] = useState<{
    [key: string]: { hasExcel: boolean; hasNotReviewedUrls: boolean };
  }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isBulkUpdateVisible, setIsBulkUpdateVisible] =
    useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchLanguages();
    const savedCategory = localStorage.getItem('activeCategory');
    if (savedCategory) {
      setActiveCategory(Number(savedCategory));
    }
  }, []);

  useEffect(() => {
    if (activeCategory !== null) {
      localStorage.setItem('activeCategory', activeCategory.toString());
      fetchSites(activeCategory);
    }
  }, [activeCategory]);

  const fetchSites = async (categoryId: number) => {
    const response = await fetch(`/api/sites?categoryId=${categoryId}`);
    const data = await response.json();
    setSites(data);
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
    if (data.length > 0 && !activeCategory) {
      setActiveCategory(data[0].id);
    }
  };

  const fetchLanguages = async () => {
    const response = await fetch('/api/languages');
    const data = await response.json();
    setLanguages(data);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/sites/by-id/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSites(sites.filter((site) => site.id !== id));
        handleNotification('Site deleted successfully', 'success');
      } else {
        handleNotification('Failed to delete site', 'error');
      }
    } catch (error) {
      console.error('Error deleting site:', error);
      handleNotification('Error deleting site', 'error');
    }
  };

  const handleSelectChange = (id: number) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((item) => item !== id)
        : [...prevSelected, id]
    );
  };

  const showDialog = (site?: Site) => {
    setEditingSite(site || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (siteData: Partial<Site>) => {
    try {
      if (editingSite) {
        await fetch(`/api/sites/${editingSite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(siteData),
        });
      } else {
        await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(siteData),
        });
      }
      setIsDialogOpen(false);
      fetchSites(activeCategory!);
      handleNotification(
        `Site ${editingSite ? 'updated' : 'added'} successfully`,
        'success'
      );
    } catch (error) {
      console.error('Error submitting site:', error);
      handleNotification(
        `Error ${editingSite ? 'updating' : 'adding'} site`,
        'error'
      );
    }
  };

  const handleNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBulkUpdate = (updatedSites: Site[]) => {
    setSites((prevSites) => {
      const updatedSiteMap = new Map(
        updatedSites.map((site) => [site.id, site])
      );
      return prevSites.map((site) => updatedSiteMap.get(site.id) || site);
    });
  };

  const toggleBulkUpdate = () => {
    setIsBulkUpdateVisible(!isBulkUpdateVisible);
  };

  const filterSitesByCategory = (categoryId: number) => {
    return sites.filter((site) =>
      site.categories.some((c) => c.category.id === categoryId)
    );
  };

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

  const checkSiteStatus = useCallback(async (domainName: string) => {
    try {
      const [excelResponse, urlsResponse] = await Promise.all([
        fetch(`/api/sites/check-excel?domain=${domainName}`),
        fetch(`/api/sites/${domainName}/urls?reviewed=false`),
      ]);

      const excelData = await excelResponse.json();
      const urlsData = await urlsResponse.json();

      setSiteStatuses((prev) => ({
        ...prev,
        [domainName]: {
          hasExcel: excelData.exists,
          hasNotReviewedUrls: urlsData.length > 0,
        },
      }));
    } catch (error) {
      console.error(`Error checking status for ${domainName}:`, error);
    }
  }, []);

  useEffect(() => {
    sites.forEach((site) => checkSiteStatus(site.domainName));
  }, [sites, checkSiteStatus]);

  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);
    setSelectedItems([]);
    setSelectAll(false);
    fetchSites(categoryId);
  };

  const handleSelectAllChange = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const filteredSites = activeCategory
        ? filterSitesByCategory(activeCategory)
        : sites;
      setSelectedItems(filteredSites.map((site) => site.id));
    } else {
      setSelectedItems([]);
    }
  };

  const columns: Column<Site>[] = [
    {
      Header: 'Domain',
      accessor: 'domainName',
      headerClassName: 'text-left',
      className: 'text-sm !text-left font-semibold',
      Cell: ({ row }) => {
        const displayDomain = row.original.domainName.replace(/^www\./i, '');
        return (
          <div>
            <Link
              href={`/sites/${row.original.domainName}`}
              className={`hover:underline ${
                siteStatuses[row.original.domainName]?.hasNotReviewedUrls
                  ? 'text-blue-600 underline'
                  : siteStatuses[row.original.domainName]?.hasExcel
                    ? ''
                    : 'font-normal text-black'
              }`}
            >
              {displayDomain}
            </Link>
            {downloadStatus[row.original.domainName] && (
              <div className="text-xs text-gray-400 font-normal">
                {downloadStatus[row.original.domainName]}
              </div>
            )}
          </div>
        );
      },
    },
    {
      Header: 'Monthly',
      accessor: 'monthly',
      headerClassName: 'w-1/2',
    },
    {
      Header: 'Languages',
      accessor: 'languages',
      Cell: ({ row }) => (
        <div>
          {row.original.languages.map((l) => l.language.name).join(', ')}
        </div>
      ),
    },
    {
      Header: 'DL',
      id: 'download',
      Cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDownload(row.original.domainName)}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            onClick={() => showDialog()}
            className="mb-4"
          >
            Add Site
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Edit Site' : 'Add Site'}</DialogTitle>
          </DialogHeader>
          <SiteForm
            site={editingSite || undefined}
            categories={categories}
            languages={languages}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            onCategoriesChange={setCategories}
            onLanguagesChange={setLanguages}
          />
        </DialogContent>
      </Dialog>

      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        onBulkUpdateToggle={toggleBulkUpdate}
      />

      {isBulkUpdateVisible && activeCategory && (
        <BulkUpdateVisitors
          activeCategory={activeCategory}
          onNotification={handleNotification}
          onBulkUpdate={handleBulkUpdate}
        />
      )}

      <TableComponent
        columns={columns}
        data={sites.sort((a, b) => b.monthly - a.monthly)}
        keyField="id"
        onEdit={showDialog}
        onDelete={handleDelete}
        selectedIds={selectedItems}
        onSelectChange={handleSelectChange}
        onSelectAll={handleSelectAllChange}
      />

      <BulkDownloadReports
        selectedItems={selectedItems}
        sites={sites}
        siteStatuses={siteStatuses}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
