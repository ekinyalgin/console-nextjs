import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Site tipini tanımlayalım
interface Site {
  id: number;
  domainName: string;
  monthly: number;
  categoryIds: number[]; // categoryIds'i ekleyelim
}

interface BulkUpdateVisitorsProps {
  activeCategory: number;
  onNotification: (message: string, type: 'success' | 'error') => void;
  onBulkUpdate: (updatedSites: Partial<Site>[]) => void;
}

export function BulkUpdateVisitors({
  activeCategory,
  onNotification,
  onBulkUpdate,
}: BulkUpdateVisitorsProps) {
  const [bulkUpdateForm, setBulkUpdateForm] = useState({
    minVisitors: '',
    maxVisitors: '',
    changeValue: '',
    changeType: 'decrease',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setBulkUpdateForm((prevForm) => ({ ...prevForm, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sites/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bulkUpdateForm,
          category: activeCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk update failed');
      }

      const data = await response.json();
      onNotification('Bulk update successful', 'success');
      onBulkUpdate(data.updatedSites);
    } catch (error) {
      console.error('Bulk update error:', error);
      if (error instanceof Error) {
        onNotification(`Error during bulk update: ${error.message}`, 'error');
      } else {
        onNotification('An unknown error occurred during bulk update', 'error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="my-6">
      <div className="flex space-x-1 text-xs sm:text-base sm:space-x-4 font-semibold ">
        <Input
          type="number"
          name="minVisitors"
          placeholder="Min Visitors"
          value={bulkUpdateForm.minVisitors}
          onChange={handleInputChange}
          className="w-1/5 text-sm h-9"
          required
        />
        <Input
          type="number"
          name="maxVisitors"
          placeholder="Max Visitors"
          value={bulkUpdateForm.maxVisitors}
          onChange={handleInputChange}
          className="w-1/5  text-sm h-9"
          required
        />
        <Input
          type="number"
          name="changeValue"
          placeholder="Change Value"
          value={bulkUpdateForm.changeValue}
          onChange={handleInputChange}
          className="w-1/5 text-sm h-9"
          required
        />
        <select
          name="changeType"
          value={bulkUpdateForm.changeType}
          onChange={handleInputChange}
          className="w-1/5 text-sm border border-gray-300 rounded-md px-3 py-0 h-9"
        >
          <option value="decrease">Decrease</option>
          <option value="increase">Increase</option>
        </select>
        <Button type="submit" variant="outline" className="w-1/5 text-sm h-9">
          Update
        </Button>
      </div>
    </form>
  );
}
