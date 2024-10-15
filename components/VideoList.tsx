import React, { useState } from 'react';
import { Button } from './ui/button';
import { DataTable } from './ui/data-table';
import { Notification } from './ui/notification';
import { AddVideoModal } from '../app/videos/components/AddVideoModal';
import { EditVideoModal } from '../app/videos/components/EditVideoModal';

export default function VideoList() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const handleAddVideo = (newVideo: Video) => {
    setVideos((prev) => [...prev, newVideo]);
    setNotification({ message: 'Video added successfully', type: 'success' });
  };

  const handleUpdateVideo = (updatedVideo: Video) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === updatedVideo.id ? updatedVideo : video))
    );
    setNotification({ message: 'Video updated successfully', type: 'success' });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Button onClick={() => setIsAddModalOpen(true)}>Add Video</Button>
        <Button onClick={openRandomVideo} className="mb-4">
          Random Video
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={videos}
        expandedRows={expandedNotes}
        renderSubComponent={({ row }) => (
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600">{row.original.note}</p>
          </div>
        )}
      />

      <AddVideoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVideoAdded={handleAddVideo}
      />

      <EditVideoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        video={editingVideo}
        onVideoUpdated={handleUpdateVideo}
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
}
