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
  onAddCategory: (name: string) => void;
  onAddLanguage: (name: string) => void;
  onDeleteCategory: (id: number) => void;
  onDeleteLanguage: (id: number) => void;
  onEditCategory: (id: number, newName: string) => void;
  onEditLanguage: (id: number, newName: string) => void;
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
  onAddCategory,
  onAddLanguage,
  onDeleteCategory,
  onDeleteLanguage,
  onEditCategory,
  onEditLanguage,
}: SiteFormProps) {
  const [formData, setFormData] = useState<Partial<Site>>({
    domainName: '',
    monthly: 0,
    categoryIds: [],
    languageIds: [],
  });
  const [newCategory, setNewCategory] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
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

  const handleAddCategory = () => {
    onAddCategory(newCategory);
    setNewCategory('');
    setIsCategoryDialogOpen(false);
  };

  const handleAddLanguage = () => {
    onAddLanguage(newLanguage);
    setNewLanguage('');
    setIsLanguageDialogOpen(false);
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
                onAdd={onAddCategory}
                onDelete={onDeleteCategory}
                onEdit={onEditCategory}
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
                onAdd={onAddLanguage}
                onDelete={onDeleteLanguage}
                onEdit={onEditLanguage}
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
