import React from 'react';
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

interface EditVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
  onVideoUpdated: (video: Video) => void;
}

export function EditVideoModal({
  isOpen,
  onClose,
  video,
  onVideoUpdated,
}: EditVideoModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updatedVideo = {
      ...video,
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      note: formData.get('note') as string,
    };

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVideo),
      });

      if (response.ok) {
        const updatedVideoData = await response.json();
        onVideoUpdated(updatedVideoData);
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      // Burada bir hata bildirimi gösterebilirsiniz
    }
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="title"
            placeholder="Title"
            defaultValue={video.title}
            required
          />
          <Input
            name="url"
            placeholder="URL"
            defaultValue={video.url}
            required
          />
          <Textarea
            name="note"
            placeholder="Note"
            defaultValue={video.note || ''}
          />
          <Button type="submit">Update Video</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
