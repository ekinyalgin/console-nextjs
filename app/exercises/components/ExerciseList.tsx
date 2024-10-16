'use client';

import React, { useReducer, useEffect, useMemo, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Exercise } from '@prisma/client';
import Notification from '@/components/Notification';
import { ExerciseModal } from './ExerciseModal';
import { ExerciseActions } from './ExerciseActions';
import { TableComponent } from '@/components/TableComponent';
import { Column } from 'react-table';

// Define the state type
interface ExerciseState {
  exercises: Exercise[];
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingExercise: Exercise | null;
  expandedDescriptions: number[];
  notification: { message: string; type: 'success' | 'error' } | null;
  selectedIds: number[];
  showOnlySelected: boolean;
}

// Define action types
type ExerciseAction =
  | { type: 'SET_EXERCISES'; payload: Exercise[] }
  | { type: 'ADD_EXERCISE'; payload: Exercise }
  | { type: 'UPDATE_EXERCISE'; payload: Exercise }
  | { type: 'DELETE_EXERCISE'; payload: number }
  | { type: 'SET_ADD_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_EDIT_MODAL_OPEN'; payload: boolean }
  | { type: 'SET_EDITING_EXERCISE'; payload: Exercise | null }
  | { type: 'TOGGLE_DESCRIPTION_EXPANSION'; payload: number }
  | { type: 'SET_NOTIFICATION'; payload: ExerciseState['notification'] }
  | { type: 'SET_SELECTED_IDS'; payload: number[] }
  | { type: 'SET_SHOW_ONLY_SELECTED'; payload: boolean };

// Define the reducer function
function exerciseReducer(
  state: ExerciseState,
  action: ExerciseAction
): ExerciseState {
  switch (action.type) {
    case 'SET_EXERCISES':
      return { ...state, exercises: action.payload };
    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.payload] };
    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map((exercise) =>
          exercise.id === action.payload.id ? action.payload : exercise
        ),
      };
    case 'DELETE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter(
          (exercise) => exercise.id !== action.payload
        ),
      };
    case 'SET_ADD_MODAL_OPEN':
      return { ...state, isAddModalOpen: action.payload };
    case 'SET_EDIT_MODAL_OPEN':
      return { ...state, isEditModalOpen: action.payload };
    case 'SET_EDITING_EXERCISE':
      return { ...state, editingExercise: action.payload };
    case 'TOGGLE_DESCRIPTION_EXPANSION':
      return {
        ...state,
        expandedDescriptions: state.expandedDescriptions.includes(
          action.payload
        )
          ? state.expandedDescriptions.filter((id) => id !== action.payload)
          : [...state.expandedDescriptions, action.payload],
      };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'SET_SELECTED_IDS':
      return { ...state, selectedIds: action.payload };
    case 'SET_SHOW_ONLY_SELECTED':
      return { ...state, showOnlySelected: action.payload };
    default:
      return state;
  }
}

export default function ExerciseList() {
  const [state, dispatch] = useReducer(exerciseReducer, {
    exercises: [],
    isAddModalOpen: false,
    isEditModalOpen: false,
    editingExercise: null,
    expandedDescriptions: [],
    notification: null,
    selectedIds: [],
    showOnlySelected: false,
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const response = await fetch('/api/exercises');
    const data = await response.json();
    dispatch({ type: 'SET_EXERCISES', payload: data });
  };

  const deleteExercise = async (id: number) => {
    try {
      await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_EXERCISE', payload: id });
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Exercise deleted successfully', type: 'success' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Failed to delete exercise', type: 'error' },
      });
    }
  };

  const toggleDescriptionExpansion = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_DESCRIPTION_EXPANSION', payload: id });
  }, []);

  const addExercise = (newExercise: Partial<Exercise>) => {
    dispatch({ type: 'ADD_EXERCISE', payload: newExercise as Exercise });
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: { message: 'Exercise added successfully', type: 'success' },
    });
  };

  const openEditModal = (exercise: Exercise) => {
    dispatch({ type: 'SET_EDITING_EXERCISE', payload: exercise });
    dispatch({ type: 'SET_EDIT_MODAL_OPEN', payload: true });
  };

  const handleEditSubmit = async (updatedExercise: Partial<Exercise>) => {
    try {
      await fetch(`/api/exercises/${updatedExercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExercise),
      });
      dispatch({ type: 'SET_EDIT_MODAL_OPEN', payload: false });
      fetchExercises();
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Exercise updated successfully', type: 'success' },
      });
    } catch (error) {
      dispatch({
        type: 'SET_NOTIFICATION',
        payload: { message: 'Failed to update exercise', type: 'error' },
      });
    }
  };

  const handleAddExercise = () => {
    dispatch({ type: 'SET_ADD_MODAL_OPEN', payload: true });
  };

  const handleRandomSelection = (selectedIds: number[]) => {
    dispatch({ type: 'SET_SELECTED_IDS', payload: selectedIds });
    dispatch({ type: 'SET_SHOW_ONLY_SELECTED', payload: true });
  };

  const handleCheckboxChange = (id: number) => {
    const newSelectedIds = state.selectedIds.includes(id)
      ? state.selectedIds.filter((selectedId) => selectedId !== id)
      : [...state.selectedIds, id];
    dispatch({ type: 'SET_SELECTED_IDS', payload: newSelectedIds });
  };

  const filteredExercises = state.showOnlySelected
    ? state.exercises.filter((exercise) =>
        state.selectedIds.includes(exercise.id)
      )
    : state.exercises;

  const columns = useMemo<Column<Exercise>[]>(
    () => [
      {
        Header: 'Title',
        accessor: 'title',
        headerClassName: 'text-left',
        className: 'w-7/12 !text-left text-sm font-semibold',
      },
      {
        Header: 'Duration',
        accessor: 'duration',
        className: 'w-2/12 text-xs text-center',
      },
      {
        Header: 'Desc',
        accessor: 'description',
        className: 'w-1/12 text-center',
        Cell: ({ row }) =>
          row.original.description ? (
            <button
              onClick={() => toggleDescriptionExpansion(row.original.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              <FileText className="w-4 h-4 text-gray-600" />
            </button>
          ) : null,
      },
    ],
    [toggleDescriptionExpansion]
  );

  const renderSubComponent = useCallback(
    ({ row }: { row: { original: Exercise } }) => (
      <p className="text-sm text-gray-600">{row.original.description}</p>
    ),
    []
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      if (isSelected) {
        const allIds = state.exercises.map((exercise) => exercise.id);
        dispatch({ type: 'SET_SELECTED_IDS', payload: allIds });
      } else {
        dispatch({ type: 'SET_SELECTED_IDS', payload: [] });
      }
    },
    [state.exercises]
  );

  return (
    <>
      <ExerciseActions
        exercises={state.exercises}
        selectedIds={state.selectedIds}
        setSelectedIds={(ids) =>
          dispatch({ type: 'SET_SELECTED_IDS', payload: ids })
        }
        setShowOnlySelected={(show) =>
          dispatch({ type: 'SET_SHOW_ONLY_SELECTED', payload: show })
        }
        setNotification={(notification) =>
          dispatch({ type: 'SET_NOTIFICATION', payload: notification })
        }
        onAddExercise={handleAddExercise}
        onRandomSelection={handleRandomSelection}
      />
      <TableComponent
        columns={columns}
        data={filteredExercises}
        keyField="id"
        selectedIds={state.selectedIds}
        onSelectAll={handleSelectAll}
        onSelectChange={handleCheckboxChange}
        onEdit={openEditModal}
        onDelete={deleteExercise}
        expandedDescriptions={state.expandedDescriptions}
        onDescriptionToggle={toggleDescriptionExpansion}
        renderSubComponent={renderSubComponent}
      />

      <ExerciseModal
        isOpen={state.isAddModalOpen}
        onClose={() => dispatch({ type: 'SET_ADD_MODAL_OPEN', payload: false })}
        onSubmit={addExercise}
        mode="add"
      />

      <ExerciseModal
        isOpen={state.isEditModalOpen}
        onClose={() =>
          dispatch({ type: 'SET_EDIT_MODAL_OPEN', payload: false })
        }
        exercise={state.editingExercise}
        onSubmit={handleEditSubmit}
        mode="edit"
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
