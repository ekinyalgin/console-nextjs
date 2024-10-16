'use client';

import React, { useState, useEffect } from 'react';
import { StickyNote, Shuffle, PlayCircle } from 'lucide-react';
import { Exercise } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import Notification from '@/components/Notification';
import { ExerciseModal } from './ExerciseModal';
import { ColumnDef } from '@tanstack/react-table';
import { ExerciseActions } from './ExerciseActions';

export default function ExerciseList() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<number[]>(
    []
  );
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const response = await fetch('/api/exercises');
    const data = await response.json();
    setExercises(data);
  };

  const deleteExercise = async (id: number) => {
    try {
      await fetch(`/api/exercises/${id}`, { method: 'DELETE' });
      fetchExercises();
      setNotification({
        message: 'Exercise deleted successfully',
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to delete exercise', type: 'error' });
    }
  };

  const toggleDescriptionExpansion = (id: number) => {
    setExpandedDescriptions((prev) =>
      prev.includes(id) ? prev.filter((descId) => descId !== id) : [...prev, id]
    );
  };

  const addExercise = (newExercise: Partial<Exercise>) => {
    setExercises((prevExercises) => [
      ...prevExercises,
      newExercise as Exercise,
    ]);
    setNotification({
      message: 'Exercise added successfully',
      type: 'success',
    });
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (updatedExercise: Partial<Exercise>) => {
    try {
      await fetch(`/api/exercises/${updatedExercise.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExercise),
      });
      setIsEditModalOpen(false);
      fetchExercises();
      setNotification({
        message: 'Exercise updated successfully',
        type: 'success',
      });
    } catch (error) {
      setNotification({ message: 'Failed to update exercise', type: 'error' });
    }
  };

  const handleAddExercise = () => {
    setIsAddModalOpen(true);
  };

  const columns: ColumnDef<Exercise>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="font-semibold text-left">{row.original.title}</span>
      ),
      headerClassName: 'text-left w-7/12',
      cellClassName: 'text-left',
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => row.original.duration,
      headerClassName: 'w-2/12',
      cellClassName: 'text-xs text-center',
    },
    {
      accessorKey: 'description',
      header: 'Desc',
      cell: ({ row }) =>
        row.original.description ? (
          <button
            onClick={() => toggleDescriptionExpansion(row.original.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            <StickyNote className="w-4 h-4 text-gray-600" />
          </button>
        ) : null,
      headerClassName: 'w-1/12',
      cellClassName: 'text-center',
    },
  ];

  const filteredExercises = showOnlySelected
    ? exercises.filter((exercise) => selectedIds.includes(exercise.id))
    : exercises;

  return (
    <>
      <ExerciseActions
        exercises={exercises}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setShowOnlySelected={setShowOnlySelected}
        setNotification={setNotification}
        onAddExercise={handleAddExercise}
      />
      <DataTable
        columns={columns}
        data={filteredExercises}
        keyField="id"
        onEdit={openEditModal}
        onDelete={deleteExercise}
        expandedRows={expandedDescriptions}
        renderSubComponent={({ row }) => (
          <div className="p-4 bg-gray-50">
            <p className="text-sm text-gray-600">{row.original.description}</p>
          </div>
        )}
        selectable={true}
        selectedItems={selectedIds}
        onSelectChange={setSelectedIds}
      />

      <ExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addExercise}
        mode="add"
      />

      <ExerciseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exercise={editingExercise}
        onSubmit={handleEditSubmit}
        mode="edit"
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
