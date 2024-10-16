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

interface SiteFormProps {
  site?: Site;
  categories: SiteCategories[];
  languages: SiteLanguages[];
  onSubmit: (siteData: Partial<Site>) => void;
  onCancel: () => void;
  onCategoriesChange: (categories: SiteCategories[]) => void;
  onLanguagesChange: (languages: SiteLanguages[]) => void;
}

interface Site {
  id?: number;
  domainName: string;
  monthly: number;
  categoryIds: number[];
  languageIds: number[];
}

interface SiteCategories {
  id: number;
  name: string;
}

interface SiteLanguages {
  id: number;
  name: string;
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
        categoryIds: site.categories.map((c) => c.category.id),
        languageIds: site.languages.map((l) => l.language.id),
      });
    }
  }, [site]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCategoryChange = (categoryId: number) => {
    const newCategoryIds = formData.categoryIds?.includes(categoryId)
      ? formData.categoryIds.filter((id) => id !== categoryId)
      : [...(formData.categoryIds || []), categoryId];
    setFormData({ ...formData, categoryIds: newCategoryIds });
  };

  const handleLanguageChange = (languageId: number) => {
    const newLanguageIds = formData.languageIds?.includes(languageId)
      ? formData.languageIds.filter((id) => id !== languageId)
      : [...(formData.languageIds || []), languageId];
    setFormData({ ...formData, languageIds: newLanguageIds });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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

  const handleAddLanguage = async (name: string) => {
    const response = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newLanguage = await response.json();
    onLanguagesChange([...languages, newLanguage]);
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      onCategoriesChange(categories.filter((category) => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleDeleteLanguage = async (id: number) => {
    try {
      await fetch(`/api/languages/${id}`, { method: 'DELETE' });
      onLanguagesChange(languages.filter((language) => language.id !== id));
    } catch (error) {
      console.error('Error deleting language:', error);
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
        value={formData.domainName}
        onChange={handleChange}
        placeholder="Domain Name"
        required
      />
      <Input
        name="monthly"
        type="number"
        value={formData.monthly}
        onChange={handleChange}
        placeholder="Monthly"
        required
      />
      <div className="flex items-center space-x-2 ">
        <div className="w-6/12 flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-3/4">
              <Button className="w-1/4" variant="outline">
                {formData.categoryIds?.length > 0
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
                  checked={formData.categoryIds?.includes(category.id)}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog
            open={isCategoryDialogOpen}
            onOpenChange={setIsCategoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" size="icon">
                <Plus className="h-4 w-4" />
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
        </div>

        <div className="w-6/12 flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-3/4">
              <Button className="w-1/4" variant="outline">
                {formData.languageIds?.length > 0
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
                  checked={formData.languageIds?.includes(language.id)}
                  onCheckedChange={() => handleLanguageChange(language.id)}
                >
                  {language.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog
            open={isLanguageDialogOpen}
            onOpenChange={setIsLanguageDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" size="icon">
                <Plus className="h-4 w-4" />
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
