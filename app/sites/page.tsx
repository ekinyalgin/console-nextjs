'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SiteForm } from './components/SiteForm';
import { SiteList } from './components/SiteList';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkUpdateVisitors } from './components/BulkUpdateVisitors';
import Notification from '@/components/Notification';
import { Settings } from 'lucide-react';
import Link from 'next/link';

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

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<SiteCategories[]>([]);
  const [languages, setLanguages] = useState<SiteLanguages[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [selectedSites, setSelectedSites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [isBulkUpdateVisible, setIsBulkUpdateVisible] =
    useState<boolean>(false);

  useEffect(() => {
    fetchSites();
    fetchCategories();
    fetchLanguages();

    const storedActiveTab = localStorage.getItem('activeTab');
    if (storedActiveTab) {
      setActiveTab(storedActiveTab);
    }

    const storedBulkUpdateVisibility = localStorage.getItem(
      'bulkUpdateVisibility'
    );
    if (storedBulkUpdateVisibility) {
      setIsBulkUpdateVisible(JSON.parse(storedBulkUpdateVisibility));
    }
  }, []);

  const fetchSites = async () => {
    const response = await fetch('/api/sites');
    const data = await response.json();
    setSites(data);
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/categories');
    const data = await response.json();
    setCategories(data);
  };

  const fetchLanguages = async () => {
    const response = await fetch('/api/languages');
    const data = await response.json();
    setLanguages(data);
  };

  const showDialog = (site?: Site) => {
    setEditingSite(site || null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (siteData: Partial<Site>) => {
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
    fetchSites();
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/sites/delete/${id}`, { method: 'DELETE' });
    fetchSites();
  };

  const handleAddCategory = async (name: string) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newCategory = await response.json();
    setCategories([...categories, newCategory]);
  };

  const handleAddLanguage = async (name: string) => {
    const response = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newLanguage = await response.json();
    setLanguages([...languages, newLanguage]);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteLanguage = async (id: number) => {
    try {
      await fetch(`/api/languages/${id}`, { method: 'DELETE' });
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  const handleSiteSelect = (newSelectedItems: number[]) => {
    setSelectedSites(newSelectedItems);
  };

  const filterSitesByCategory = (categoryId: number) => {
    return sites.filter((site) =>
      site.categories.some((c) => c.category.id === categoryId)
    );
  };

  const handleEditCategory = async (id: number, newName: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error editing category:', error);
    }
  };

  const handleEditLanguage = async (id: number, newName: string) => {
    try {
      const response = await fetch(`/api/languages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        fetchLanguages();
      }
    } catch (error) {
      console.error('Error editing language:', error);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
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
    const newVisibility = !isBulkUpdateVisible;
    setIsBulkUpdateVisible(newVisibility);
    localStorage.setItem('bulkUpdateVisibility', JSON.stringify(newVisibility));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold my-6">Sites</h1>
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
            onAddCategory={handleAddCategory}
            onAddLanguage={handleAddLanguage}
            onDeleteCategory={handleDeleteCategory}
            onDeleteLanguage={handleDeleteLanguage}
            onEditCategory={handleEditCategory}
            onEditLanguage={handleEditLanguage}
          />
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="border-b w-full text-left flex items-center justify-between">
          <div className="flex">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id.toString()}>
                {category.name}
              </TabsTrigger>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBulkUpdate}
            className="pb-1"
          >
            <Settings strokeWidth={1} className="h-4 w-4" />
          </Button>
        </TabsList>
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id.toString()}>
            {isBulkUpdateVisible && (
              <BulkUpdateVisitors
                activeCategory={category.id}
                onNotification={handleNotification}
                onBulkUpdate={handleBulkUpdate}
              />
            )}
            <SiteList
              sites={filterSitesByCategory(category.id).sort(
                (a, b) => b.monthly - a.monthly
              )}
              onEdit={showDialog}
              onDelete={handleDelete}
              onSelect={handleSiteSelect}
              selectedItems={selectedSites}
            />
          </TabsContent>
        ))}
      </Tabs>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
