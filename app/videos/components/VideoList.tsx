'use client';

import React, { useState, useEffect } from 'react';
import {
  Check,
  Settings2,
  Trash2,
  ExternalLink,
  StickyNote,
  X,
} from 'lucide-react';
import { Video } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import Notification from '@/components/Notification';
import { AddVideoModal } from './AddVideoModal';
import { EditVideoModal } from './EditVideoModal';
import { ColumnDef } from '@tanstack/react-table';

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);
  const [deletingVideo, setDeletingVideo] = useState<number | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const response = await fetch('/api/videos');
    const data = await response.json();
    const sortedVideos = data.sort((a: Video, b: Video) => {
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });
    setVideos(sortedVideos);
  };

  const deleteVideo = async (id: number) => {
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      fetchVideos();
      setNotification({
        message: 'Video deleted successfully',
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to delete video', type: 'error' });
    }
    setDeletingVideo(null);
  };

  const toggleVideoActive = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      await fetchVideos();
      setNotification({ message: 'Video status updated', type: 'success' });
    } catch (error) {
      setNotification({
        message: 'Failed to update video status',
        type: 'error',
      });
    }
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (updatedVideo: Video) => {
    try {
      await fetch(`/api/videos/${updatedVideo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVideo),
      });
      setIsEditModalOpen(false);
      fetchVideos();
      setNotification({
        message: 'Video updated successfully',
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to update video', type: 'error' });
    }
  };

  const toggleNoteExpansion = (id: number) => {
    setExpandedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  };

  const openRandomVideo = async () => {
    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];
    window.open(randomVideo.url, '_blank');
    await toggleVideoActive(randomVideo.id, randomVideo.isActive);
  };

  const addVideo = (newVideo: Video) => {
    setVideos((prevVideos) => {
      const updatedVideos = [...prevVideos, newVideo];
      return updatedVideos.sort((a, b) => {
        if (a.isActive === b.isActive) return 0;
        return a.isActive ? -1 : 1;
      });
    });
    setNotification({ message: 'Video added successfully', type: 'success' });
  };

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  };

  const columns: ColumnDef<Video>[] = [
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <button
          onClick={() =>
            toggleVideoActive(row.original.id, row.original.isActive)
          }
          className="flex justify-center items-center w-full"
        >
          <Check
            strokeWidth={3}
            className={`w-4 h-4 ${
              row.original.isActive
                ? 'text-green-500'
                : 'text-gray-300 hover:text-green-500 transition'
            }`}
          />
        </button>
      ),
      headerClassName: 'w-1/12',
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <a
          href={row.original.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black text-sm font-medium hover:text-blue-800 flex items-center"
        >
          <span className="truncate">{truncateTitle(row.original.title)}</span>
          <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0" />
        </a>
      ),
      headerClassName: 'text-left w-8/12',
      cellClassName: 'text-left',
    },
    {
      accessorKey: 'note',
      header: 'Note',
      cell: ({ row }) =>
        row.original.note && (
          <button
            onClick={() => toggleNoteExpansion(row.original.id)}
            className="flex justify-center items-center w-full"
          >
            <StickyNote className="w-4 h-4 text-gray-600" />
          </button>
        ),
      headerClassName: 'w-1/12',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => openEditModal(row.original)}
            className="text-indigo-600 hover:text-indigo-900"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          {deletingVideo === row.original.id ? (
            <>
              <button
                onClick={() => deleteVideo(row.original.id)}
                className="text-green-600 hover:text-green-900"
              >
                <Check strokeWidth="3" className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingVideo(null)}
                className="text-red-600 hover:text-red-900"
              >
                <X strokeWidth="3" className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setDeletingVideo(row.original.id)}
              className="text-red-600 hover:text-red-900"
            >
              <X strokeWidth="3" className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
      headerClassName: 'w-2/12',
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
          Add Video
        </Button>
        <Button variant="outline" onClick={openRandomVideo} className="mb-4">
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
        onVideoAdded={addVideo}
      />

      <EditVideoModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        video={editingVideo}
        onVideoUpdated={handleEditSubmit}
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
