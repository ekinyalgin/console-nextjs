'use client';

import React, {
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useState,
} from 'react';
import { Check, ExternalLink, FileText } from 'lucide-react';
import { Video } from '@prisma/client';
import { TableComponent } from '@/components/TableComponent';
import Notification from '@/components/Notification';
import { VideoModal } from './VideoModal';
import { Column } from 'react-table';
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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

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

  const openAddModal = () => {
    setEditingVideo(null);
    setIsVideoModalOpen(true);
  };

  const openEditModal = (video: Video) => {
    setEditingVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async (videoData: Partial<Video>) => {
    try {
      if (editingVideo) {
        // Edit existing video
        const response = await fetch(`/api/videos/${editingVideo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        });
        const updatedVideo = await response.json();
        dispatch({ type: 'UPDATE_VIDEO', payload: updatedVideo });
      } else {
        // Add new video
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
        });
        const newVideo = await response.json();
        dispatch({ type: 'ADD_VIDEO', payload: newVideo });
      }
      setIsVideoModalOpen(false);
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: {
          message: `Video ${editingVideo ? 'updated' : 'added'} successfully`,
          type: 'success',
        },
      });
    } catch (error) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: {
          message: `Failed to ${editingVideo ? 'update' : 'add'} video`,
          type: 'error',
        },
      });
    }
  };

  const toggleNoteExpansion = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_NOTE_EXPANSION', payload: id });
  }, []);

  const truncateTitle = useCallback((title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title;
    return title.slice(0, maxLength) + '...';
  }, []);

  const columns = useMemo<Column<Video>[]>(
    () => [
      {
        Header: 'Active',
        accessor: 'isActive',
        Cell: ({ row }) => (
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
        className: 'w-1/12',
      },
      {
        Header: 'Title',
        accessor: 'title',
        Cell: ({ row }) => (
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
        className: 'text-left w-8/12',
        headerClassName: 'text-left',
      },
      {
        Header: 'Note',
        accessor: 'note',
        Cell: ({ row }) =>
          row.original.note ? (
            <button
              onClick={() => toggleNoteExpansion(row.original.id)}
              className="flex justify-center items-center w-full"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          ) : null,
        className: 'w-1/12',
      },
    ],
    [toggleVideoActive, truncateTitle, toggleNoteExpansion]
  );

  const renderSubComponent = useCallback(
    ({ row }: { row: { original: Video } }) => (
      <p className="text-sm text-gray-600">{row.original.note}</p>
    ),
    []
  );

  if (state.isLoading) return <div>Loading...</div>;
  if (state.error) return <div>Error: {state.error}</div>;

  return (
    <>
      <VideoActions
        videos={state.videos}
        onAddVideo={openAddModal}
        onVideoStatusChange={toggleVideoActive}
        setNotification={(notification) =>
          dispatch({ type: 'SET_NOTIFICATION', payload: notification })
        }
      />
      <TableComponent
        columns={columns}
        data={state.videos}
        keyField="id"
        onEdit={openEditModal}
        onDelete={deleteVideo}
        expandedDescriptions={state.expandedNotes}
        onDescriptionToggle={toggleNoteExpansion}
        renderSubComponent={renderSubComponent}
      />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onVideoSubmit={handleVideoSubmit}
        video={editingVideo}
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
