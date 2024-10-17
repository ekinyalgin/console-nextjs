import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { CategoryLanguageManager } from './CategoryLanguageManager';

interface Site {
  id?: number;
  domainName: string;
  monthly: number;
  categories: { category: { id: number; name: string } }[];
  languages: { language: { id: number; name: string } }[];
  categoryIds?: number[];
  languageIds?: number[];
}

interface SiteCategories {
  id: number;
  name: string;
}

interface SiteLanguages {
  id: number;
  name: string;
}

interface SiteFormProps {
  site?: Site;
  categories: SiteCategories[];
  languages: SiteLanguages[];
  onSubmit: (siteData: Partial<Site>) => Promise<void>;
  onCancel: () => void;
  onCategoriesChange: React.Dispatch<React.SetStateAction<SiteCategories[]>>;
  onLanguagesChange: React.Dispatch<React.SetStateAction<SiteLanguages[]>>;
}

export function SiteForm({
  site,
  categories,
  languages,
  onSubmit,
  onCancel,
  onCategoriesChange,
  onLanguagesChange,
}: SiteFormProps) {
  const [formData, setFormData] = useState<Partial<Site>>({
    domainName: '',
    monthly: 0,
    categoryIds: [],
    languageIds: [],
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        domainName: site.domainName,
        monthly: site.monthly,
        categoryIds:
          site.categoryIds || site.categories.map((c) => c.category.id),
        languageIds:
          site.languageIds || site.languages.map((l) => l.language.id),
      });
    }
  }, [site]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (categoryId: number) => {
    setFormData((prev) => {
      const currentCategoryIds = prev.categoryIds || [];
      const newCategoryIds = currentCategoryIds.includes(categoryId)
        ? currentCategoryIds.filter((id) => id !== categoryId)
        : [...currentCategoryIds, categoryId];
      return { ...prev, categoryIds: newCategoryIds };
    });
  };

  const handleLanguageChange = (languageId: number) => {
    setFormData((prev) => {
      const currentLanguageIds = prev.languageIds || [];
      const newLanguageIds = currentLanguageIds.includes(languageId)
        ? currentLanguageIds.filter((id) => id !== languageId)
        : [...currentLanguageIds, languageId];
      return { ...prev, languageIds: newLanguageIds };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddCategory = async (name: string) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newCategory = await response.json();
    onCategoriesChange([...categories, newCategory]);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      onCategoriesChange(categories.filter((category) => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEditCategory = async (id: number, newName: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (response.ok) {
        onCategoriesChange(
          categories.map((category) =>
            category.id === id ? { ...category, name: newName } : category
          )
        );
      }
    } catch (error) {
      console.error('Error editing category:', error);
    }
  };

  const handleAddLanguage = async (name: string) => {
    const response = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newLanguage = await response.json();
    onLanguagesChange([...languages, newLanguage]);
  };

  const handleDeleteLanguage = async (id: number) => {
    try {
      await fetch(`/api/languages/${id}`, {
        method: 'DELETE',
      });
      onLanguagesChange(languages.filter((language) => language.id !== id));
    } catch (error) {
      console.error('Error deleting language:', error);
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
        onLanguagesChange(
          languages.map((language) =>
            language.id === id ? { ...language, name: newName } : language
          )
        );
      }
    } catch (error) {
      console.error('Error editing language:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        name="domainName"
        value={formData.domainName || ''}
        onChange={handleChange}
        placeholder="Domain Name"
        required
      />
      <Input
        name="monthly"
        type="number"
        value={formData.monthly || 0}
        onChange={handleChange}
        placeholder="Monthly"
        required
      />
      <div className="flex space-x-4">
        <div className="w-5/12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full" variant="outline">
                {(formData.categoryIds?.length || 0) > 0
                  ? categories
                      .filter((c) => formData.categoryIds?.includes(c.id))
                      .map((c) => c.name)
                      .join(', ')
                  : 'Select Categories'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={formData.categoryIds?.includes(category.id) || false}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
        >
          <DialogTrigger asChild>
            <Button type="button" className="w-2/12">
              <Plus className="h-4 w-4 mx-auto" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
            </DialogHeader>
            <CategoryLanguageManager
              items={categories}
              onAdd={handleAddCategory}
              onDelete={handleDeleteCategory}
              onEdit={handleEditCategory}
              type="category"
            />
          </DialogContent>
        </Dialog>
        <div className="w-5/12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full" variant="outline">
                {(formData.languageIds?.length || 0) > 0
                  ? languages
                      .filter((l) => formData.languageIds?.includes(l.id))
                      .map((l) => l.name)
                      .join(', ')
                  : 'Select Languages'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {languages.map((language) => (
                <DropdownMenuCheckboxItem
                  key={language.id}
                  checked={formData.languageIds?.includes(language.id) || false}
                  onCheckedChange={() => handleLanguageChange(language.id)}
                >
                  {language.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Dialog
          open={isLanguageDialogOpen}
          onOpenChange={setIsLanguageDialogOpen}
        >
          <DialogTrigger asChild>
            <Button type="button" className="w-2/12">
              <Plus className="h-4 w-4 mx-auto" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Languages</DialogTitle>
            </DialogHeader>
            <CategoryLanguageManager
              items={languages}
              onAdd={handleAddLanguage}
              onDelete={handleDeleteLanguage}
              onEdit={handleEditLanguage}
              type="language"
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
