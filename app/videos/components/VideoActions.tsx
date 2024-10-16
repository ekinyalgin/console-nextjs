import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddVideoModal } from './AddVideoModal';
import { Video } from '@prisma/client';

interface VideoActionsProps {
  videos: Video[];
  onAddVideo: (newVideo: Video) => void;
  onVideoStatusChange: (id: number, isActive: boolean) => Promise<void>;
  setNotification: (notification: {
    message: string;
    type: 'success' | 'error';
  }) => void;
}

export function VideoActions({
  videos,
  onAddVideo,
  onVideoStatusChange,
  setNotification,
}: VideoActionsProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const openRandomVideo = async () => {
    if (videos.length === 0) {
      setNotification({ message: 'No videos available', type: 'error' });
      return;
    }
    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];
    window.open(randomVideo.url, '_blank');
    await onVideoStatusChange(randomVideo.id, randomVideo.isActive);
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
        Add Video
      </Button>
      <Button variant="outline" onClick={openRandomVideo}>
        Random Video
      </Button>

      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVideoAdded={onAddVideo}
      />
    </div>
  );
}
