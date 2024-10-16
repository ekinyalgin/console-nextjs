'use client';

import React, { useEffect, useMemo, useCallback, useReducer } from 'react';
import { Check, ExternalLink, StickyNote } from 'lucide-react';
import { Video } from '@prisma/client';
import { DataTable } from '@/components/DataTable';
import Notification from '@/components/Notification';
import { EditVideoModal } from './EditVideoModal';
import { ColumnDef } from '@tanstack/react-table';
import { VideoActions } from './VideoActions';

type State = {
  videos: Video[];
  isEditModalOpen: boolean;
  editingVideo: Video | null;
  expandedNotes: number[];
  notification: { message: string; type: 'success' | 'error' } | null;
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'FETCH_VIDEOS_START' }
  | { type: 'FETCH_VIDEOS_SUCCESS'; payload: Video[] }
  | { type: 'FETCH_VIDEOS_ERROR'; payload: string }
  | {
      type: 'SET_EDIT_MODAL';
      payload: { isOpen: boolean; video: Video | null };
    }
  | { type: 'TOGGLE_NOTE_EXPANSION'; payload: number }
  | { type: 'ADD_VIDEO'; payload: Video }
  | { type: 'UPDATE_VIDEO'; payload: Video }
  | { type: 'DELETE_VIDEO'; payload: number }
  | {
      type: 'SET_NOTIFICATION';
      payload: { message: string; type: 'success' | 'error' } | null;
    };

const initialState: State = {
  videos: [],
  isEditModalOpen: false,
  editingVideo: null,
  expandedNotes: [],
  notification: null,
  isLoading: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_VIDEOS_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_VIDEOS_SUCCESS':
      return { ...state, isLoading: false, videos: action.payload };
    case 'FETCH_VIDEOS_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'SET_EDIT_MODAL':
      return {
        ...state,
        isEditModalOpen: action.payload.isOpen,
        editingVideo: action.payload.video,
      };
    case 'TOGGLE_NOTE_EXPANSION':
      return {
        ...state,
        expandedNotes: state.expandedNotes.includes(action.payload)
          ? state.expandedNotes.filter((id) => id !== action.payload)
          : [...state.expandedNotes, action.payload],
      };
    case 'ADD_VIDEO':
      return {
        ...state,
        videos: [...state.videos, action.payload].sort((a, b) =>
          a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1
        ),
      };
    case 'UPDATE_VIDEO':
      const updatedVideos = state.videos.map((video) =>
        video.id === action.payload.id ? action.payload : video
      );
      return {
        ...state,
        videos: updatedVideos.sort((a, b) =>
          a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1
        ),
      };
    case 'DELETE_VIDEO':
      return {
        ...state,
        videos: state.videos.filter((video) => video.id !== action.payload),
      };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    default:
      return state;
  }
}

export default function VideoList() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchVideos = useCallback(async () => {
    dispatch({ type: 'FETCH_VIDEOS_START' });
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      dispatch({ type: 'FETCH_VIDEOS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({
        type: 'FETCH_VIDEOS_ERROR',
        payload: 'Failed to fetch videos',
      });
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const deleteVideo = useCallback(async (id: number) => {
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_VIDEO', payload: id });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Video deleted successfully', type: 'success' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Failed to delete video', type: 'error' },
      });
    }
  }, []);

  const toggleVideoActive = useCallback(
    async (id: number, currentStatus: boolean) => {
      try {
        const response = await fetch(`/api/videos/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !currentStatus }),
        });
        const updatedVideo = await response.json();
        dispatch({ type: 'UPDATE_VIDEO', payload: updatedVideo });
        dispatch({
          type: 'SET_NOTIFICATION',
          payload: { message: 'Video status updated', type: 'success' },
        });
      } catch (error) {
        dispatch({
          type: 'SET_NOTIFICATION',
          payload: { message: 'Failed to update video status', type: 'error' },
        });
      }
    },
    []
  );

  const openEditModal = useCallback((video: Video) => {
    dispatch({ type: 'SET_EDIT_MODAL', payload: { isOpen: true, video } });
  }, []);

  const handleEditSubmit = useCallback(async (updatedVideo: Video) => {
    try {
      const response = await fetch(`/api/videos/${updatedVideo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVideo),
      });
      const video = await response.json();
      dispatch({ type: 'UPDATE_VIDEO', payload: video });
      dispatch({
        type: 'SET_EDIT_MODAL',
        payload: { isOpen: false, video: null },
      });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Video updated successfully', type: 'success' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Failed to update video', type: 'error' },
      });
    }
  }, []);

  const toggleNoteExpansion = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_NOTE_EXPANSION', payload: id });
  }, []);

  const addVideo = useCallback((newVideo: Video) => {
    dispatch({ type: 'ADD_VIDEO', payload: newVideo });
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: { message: 'Video added successfully', type: 'success' },
    });
  }, []);

  const truncateTitle = useCallback((title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  }, []);

  const columns = useMemo<ColumnDef<Video>[]>(
    () => [
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
            <span className="truncate">
              {truncateTitle(row.original.title)}
            </span>
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
    ],
    [toggleVideoActive, truncateTitle, toggleNoteExpansion]
  );

  const renderSubComponent = useCallback(
    ({ row }: { row: { original: Video } }) => (
      <tr>
        <td>
          <p className="text-sm text-gray-600">{row.original.note}</p>
        </td>
      </tr>
    ),
    [columns.length]
  );

  if (state.isLoading) return <div>Loading...</div>;
  if (state.error) return <div>Error: {state.error}</div>;

  return (
    <>
      <VideoActions
        videos={state.videos}
        onAddVideo={addVideo}
        onVideoStatusChange={toggleVideoActive}
        setNotification={(notification) =>
          dispatch({ type: 'SET_NOTIFICATION', payload: notification })
        }
      />
      <DataTable
        columns={columns}
        data={state.videos}
        keyField="id"
        onEdit={openEditModal}
        onDelete={deleteVideo}
        expandedRows={state.expandedNotes}
        renderSubComponent={renderSubComponent}
      />

      <EditVideoModal
        isOpen={state.isEditModalOpen}
        onClose={() =>
          dispatch({
            type: 'SET_EDIT_MODAL',
            payload: { isOpen: false, video: null },
          })
        }
        video={state.editingVideo}
        onVideoUpdated={handleEditSubmit}
      />

      {state.notification && (
        <Notification
          message={state.notification.message}
          type={state.notification.type}
          onClose={() => dispatch({ type: 'SET_NOTIFICATION', payload: null })}
        />
      )}
    </>
  );
}
