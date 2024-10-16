import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface CategoryTabsProps {
  categories: { id: number; name: string }[];
  activeCategory: number | null;
  onCategoryChange: (categoryId: number) => void;
  onBulkUpdateToggle: () => void;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  onBulkUpdateToggle,
}: CategoryTabsProps) {
  useEffect(() => {
    const savedCategory = localStorage.getItem('activeCategory');
    if (
      savedCategory &&
      categories.some((cat) => cat.id === parseInt(savedCategory))
    ) {
      onCategoryChange(parseInt(savedCategory));
    } else if (categories.length > 0) {
      onCategoryChange(categories[0].id);
    }
  }, [categories]);

  useEffect(() => {
    if (activeCategory !== null) {
      localStorage.setItem('activeCategory', activeCategory.toString());
    }
  }, [activeCategory]);

  const handleCategoryChange = (categoryId: number) => {
    onCategoryChange(categoryId);
  };

  return (
    <div className="flex justify-between items-center mb-4 border-b">
      <div className="space-x-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`text-sm h-10 px-2 ${
              activeCategory === category.id
                ? 'border-b-2 border-gray-600'
                : 'bg-red text-black'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onBulkUpdateToggle}
        className="pb-1"
      >
        <Settings strokeWidth={1} className="h-4 w-4" />
      </Button>
    </div>
  );
}
