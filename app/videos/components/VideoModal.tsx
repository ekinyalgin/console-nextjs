import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Video } from '@prisma/client';
import { Upload } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoSubmit: (video: Partial<Video>) => void;
  video?: Video | null;
}

export function VideoModal({
  isOpen,
  onClose,
  onVideoSubmit,
  video,
}: VideoModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setUrl(video.url);
      setNote(video.note || '');
    } else {
      setTitle('');
      setUrl('');
      setNote('');
    }
  }, [video]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedTitle = title
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\|/g, '-')
      .replace(/"/g, '');

    const videoData: Partial<Video> = {
      title: formattedTitle,
      url,
      note,
    };

    if (video) {
      videoData.id = video.id;
    }

    onVideoSubmit(videoData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      console.error('No file selected');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const response = await fetch('/api/videos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });

        if (response.ok) {
          const importedVideos = await response.json();
          importedVideos.forEach(onVideoSubmit);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          onClose();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import videos');
        }
      } catch (error) {
        console.error('Error importing videos:', error);
        // Burada bir hata bildirimi gösterebilirsiniz
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{video ? 'Edit Video' : 'Add New Video'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <Textarea
            placeholder="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-between">
            <Button type="submit">{video ? 'Update' : 'Add'} Video</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
        {!video && (
          <div className="flex items-center justify-between mt-4 space-x-2">
            <Input
              type="file"
              className="grow"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {selectedFile && (
              <Button onClick={handleImport} className="w-60 flex items-center">
                <Upload className="w-4 h-4 mr-2" /> Import JSON
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
