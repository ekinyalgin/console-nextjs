'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash } from 'lucide-react';

export function TodoDialog({ isOpen, onClose, onSave, todo }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [links, setLinks] = useState([]);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDate(todo.date.split('T')[0]);
      setNote(todo.note || '');
      setLinks(todo.links || []);
    } else {
      setTitle('');
      setDate('');
      setNote('');
      setLinks([]);
    }
  }, [todo]);

  const handleAddLink = () => {
    setLinks([...links, { url: '', icon: '' }]);
  };

  const handleRemoveLink = (index) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
  };

  const handleLinkChange = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const handleSave = () => {
    onSave({
      title,
      date,
      note,
      links: links.map((link) => ({ url: link.url, icon: link.icon })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{todo ? 'Edit Todo' : 'Add Todo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Textarea
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div>
            <Button onClick={handleAddLink} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Link
            </Button>
          </div>
          {links.map((link, index) => (
            <div key={index} className="flex space-x-2">
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              />
              <Input
                placeholder="Icon"
                value={link.icon}
                onChange={(e) =>
                  handleLinkChange(index, 'icon', e.target.value)
                }
              />
              <Button
                onClick={() => handleRemoveLink(index)}
                variant="ghost"
                size="icon"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
