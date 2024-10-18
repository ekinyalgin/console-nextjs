'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TableComponent, ExtendedColumn } from '@/components/TableComponent';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SiteForm } from './SiteForm';
import ImportNewUrls from './ImportNewUrls';
import { BulkUpdateVisitors } from './BulkUpdateVisitors';
import Notification from '@/components/Notification';
import { CategoryTabs } from './CategoryTabs';
import { BulkDownloadReports } from './BulkDownloadReports';

interface Site {
  id: number;
  domainName: string;
  monthly: number;
  categories: { category: { id: number; name: string } }[];
  languages: { language: { id: number; name: string } }[];
  SiteCategory: { category: { id: number } }[];
  categoryIds: number[]; // Bu satırı ekleyin
}

interface SiteCategories {
  id: number;
  name: string;
}

interface SiteLanguages {
  id: number;
  name: string;
}

interface SiteStatus {
  hasExcel: boolean;
  hasNotReviewedUrls: boolean;
}

export default function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<SiteCategories[]>([]);
  const [languages, setLanguages] = useState<SiteLanguages[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [downloadStatus, setDownloadStatus] = useState<Record<string, string>>(
    {}
  );
  const [siteStatuses, setSiteStatuses] = useState<Record<string, SiteStatus>>(
    {}
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isBulkUpdateVisible, setIsBulkUpdateVisible] =
    useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);

  const fetchSites = useCallback(async (categoryId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/sites?categoryId=${categoryId}`);
      const data = await response.json();
      console.log('Fetched sites:', data);
      setSites(data);
    } catch (error) {
      console.error('Error fetching sites:', error);
      handleNotification('Error fetching sites', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
      setIsCategoriesLoaded(true);
      if (data.length > 0) {
        const savedCategory = localStorage.getItem('activeCategory');
        const initialCategory = savedCategory
          ? Number(savedCategory)
          : data[0].id;
        setActiveCategory(initialCategory);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      handleNotification('Error fetching categories', 'error');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchLanguages();
  }, [fetchCategories]);

  useEffect(() => {
    if (isCategoriesLoaded && activeCategory !== null) {
      localStorage.setItem('activeCategory', activeCategory.toString());
      fetchSites(activeCategory);
    }
  }, [isCategoriesLoaded, activeCategory, fetchSites]);

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
    if (site) {
      // categoryIds'i oluşturun
      const categoryIds = site.categories.map((c) => c.category.id);
      setEditingSite({ ...site, categoryIds });
    } else {
      setEditingSite(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (siteData: Partial<Site>) => {
    try {
      let response;
      if (editingSite) {
        response = await fetch(`/api/sites/by-id/${editingSite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(siteData),
        });
      } else {
        response = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(siteData),
        });
      }
      const updatedSite = await response.json();
      console.log('Updated site:', updatedSite);
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

  const handleCategoryChange = useCallback(
    (categoryId: number) => {
      setActiveCategory(categoryId);
      setSelectedItems([]);
      fetchSites(categoryId);
    },
    [fetchSites]
  );

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const filteredSites = activeCategory
        ? filterSitesByCategory(activeCategory)
        : sites;
      setSelectedItems(filteredSites.map((site) => site.id));
    } else {
      setSelectedItems([]);
    }
  };

  const columns: ExtendedColumn<Site>[] = [
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
              className={` ${
                siteStatuses[row.original.domainName]?.hasNotReviewedUrls
                  ? 'text-black underline'
                  : siteStatuses[row.original.domainName]?.hasExcel
                    ? ''
                    : 'font-normal text-gray-400'
              }`}
            >
              {displayDomain}
            </Link>
            {downloadStatus[row.original.domainName] && (
              <div className="text-xs text-gray-400 font-normal block">
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
      className: 'text-xs text-center',
    },
    {
      Header: 'Languages',
      accessor: 'languages',
      className: 'text-xs text-center',
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
          onBulkUpdate={(updatedSites) =>
            handleBulkUpdate(updatedSites as Site[])
          }
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
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
      )}
      <div className="flex items-center space-x-2 mt-4">
        <BulkDownloadReports selectedItems={selectedItems} sites={sites} />
        <ImportNewUrls />
      </div>
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
