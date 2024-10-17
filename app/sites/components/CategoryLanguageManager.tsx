import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash, Edit, Check } from 'lucide-react';

interface CategoryLanguageManagerProps {
  items: { id: number; name: string }[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, newName: string) => void;
  type: 'category' | 'language';
}

export function CategoryLanguageManager({
  items,
  onAdd,
  onDelete,
  onEdit,
  type,
}: CategoryLanguageManagerProps) {
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const handleEditStart = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleEditSave = () => {
    if (editingId !== null && editingName.trim()) {
      onEdit(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`New ${type} name`}
        />
        <Button onClick={handleAdd}>
          <Plus className="h-6 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            {editingId === item.id ? (
              <>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                />
                <button onClick={handleEditSave}>
                  <Check strokeWidth="3" className="ml-4 h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="text-sm font-semibold">{item.name}</span>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEditStart(item.id, item.name)}
                    variant="ghost"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => onDelete(item.id)} variant="ghost">
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
