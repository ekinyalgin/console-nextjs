'use client';

import React, { useState, useEffect } from 'react';
import { StickyNote, Shuffle, PlayCircle } from 'lucide-react';
import { Exercise } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';
import Notification from '@/components/Notification';
import { AddExerciseModal } from './AddExerciseModal';
import { EditExerciseModal } from './EditExerciseModal';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

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

  const addExercise = (newExercise: Exercise) => {
    setExercises((prevExercises) => [...prevExercises, newExercise]);
    setNotification({
      message: 'Exercise added successfully',
      type: 'success',
    });
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (updatedExercise: Exercise) => {
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

  const handleRandomSelection = () => {
    if (exercises.length > 0) {
      const totalDuration = exercises.reduce((acc, exercise) => {
        const [minutes, seconds] = exercise.duration.split(':').map(Number);
        return acc + minutes * 60 + seconds;
      }, 0);

      const targetDuration = totalDuration / 7;
      let selectedDuration = 0;
      const selected = [];
      const shuffledExercises = [...exercises].sort(() => 0.5 - Math.random());

      for (let i = 0; i < shuffledExercises.length; i++) {
        const exercise = shuffledExercises[i];
        const [minutes, seconds] = exercise.duration.split(':').map(Number);
        const durationInSeconds = minutes * 60 + seconds;

        if (selectedDuration + durationInSeconds <= targetDuration) {
          selected.push(exercise.id);
          selectedDuration += durationInSeconds;
        }

        if (selectedDuration >= targetDuration) break;
      }

      setSelectedIds(selected);
      setShowOnlySelected(true);
    } else {
      setNotification({
        message: 'No exercises available',
        type: 'error',
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setShowOnlySelected(false);
  };

  const handleStartExercise = () => {
    if (selectedIds.length > 0) {
      const selectedExercises = exercises.filter((exercise) =>
        selectedIds.includes(exercise.id)
      );
      router.push(
        `/exercises/workout?exercises=${JSON.stringify(selectedExercises)}`
      );
    } else {
      setNotification({
        message: 'No exercises selected',
        type: 'error',
      });
    }
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
    },
  ];

  const filteredExercises = showOnlySelected
    ? exercises.filter((exercise) => selectedIds.includes(exercise.id))
    : exercises;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRandomSelection}>
            <Shuffle className="w-4 h-4 mr-2" /> Random
          </Button>
          <Button variant="outline" onClick={handleClearSelection}>
            Clear Selection
          </Button>
          <Button variant="outline" onClick={handleStartExercise}>
            <PlayCircle className="w-4 h-4 mr-2" /> Start Exercise
          </Button>
        </div>
        <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
          Add Exercise
        </Button>
      </div>
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

      <AddExerciseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onExerciseAdded={addExercise}
      />

      <EditExerciseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exercise={editingExercise}
        onExerciseUpdated={handleEditSubmit}
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
