'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StickyNote } from 'lucide-react';
import { Exercise } from '@prisma/client';
import { Button } from '@/components/ui/button';
import Notification from '@/components/Notification';
import { ExerciseModal } from './ExerciseModal';
import { ExerciseActions } from './ExerciseActions';
import { TableComponent } from '@/components/TableComponent';
import { Column } from 'react-table';

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

  const toggleDescriptionExpansion = useCallback((id: number) => {
    setExpandedDescriptions((prev) =>
      prev.includes(id) ? prev.filter((descId) => descId !== id) : [...prev, id]
    );
  }, []);

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

  const handleRandomSelection = (selectedIds: number[]) => {
    setSelectedIds(selectedIds);
    setShowOnlySelected(true);
  };

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  const filteredExercises = showOnlySelected
    ? exercises.filter((exercise) => selectedIds.includes(exercise.id))
    : exercises;

  const columns = useMemo<Column<Exercise>[]>(
    () => [
      {
        Header: 'Title',
        accessor: 'title',
        className: 'w-7/12 text-left font-semibold',
      },
      {
        Header: 'Duration',
        accessor: 'duration',
        className: 'w-2/12 text-center',
      },
      {
        Header: 'Description',
        accessor: 'description',
        className: 'w-1/12 text-center',
        Cell: ({ row }) =>
          row.original.description ? (
            <button
              onClick={() => toggleDescriptionExpansion(row.original.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              <StickyNote className="w-4 h-4 text-gray-600" />
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

  return (
    <>
      <ExerciseActions
        exercises={exercises}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        setShowOnlySelected={setShowOnlySelected}
        setNotification={setNotification}
        onAddExercise={handleAddExercise}
        onRandomSelection={handleRandomSelection}
      />
      <TableComponent
        columns={columns}
        data={filteredExercises}
        keyField="id"
        selectedIds={selectedIds}
        onSelectChange={handleCheckboxChange}
        onEdit={openEditModal}
        onDelete={deleteExercise}
        expandedDescriptions={expandedDescriptions}
        onDescriptionToggle={toggleDescriptionExpansion}
        renderSubComponent={renderSubComponent}
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
