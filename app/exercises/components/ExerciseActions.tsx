import React from 'react';
import { Button } from '@/components/ui/button';
import { Exercise } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface ExerciseActionsProps {
  exercises: Exercise[];
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  setShowOnlySelected: (show: boolean) => void;
  setNotification: (
    notification: { message: string; type: 'success' | 'error' } | null
  ) => void;
  onAddExercise: () => void;
  onRandomSelection: (selectedIds: number[]) => void;
}

export function ExerciseActions({
  exercises,
  selectedIds,
  setSelectedIds,
  setShowOnlySelected,
  setNotification,
  onAddExercise,
  onRandomSelection,
}: ExerciseActionsProps) {
  const router = useRouter();

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

      onRandomSelection(selected);
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

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex space-x-2">
        <Button variant="outline" onClick={handleRandomSelection}>
          Random
        </Button>
        <Button variant="outline" onClick={handleClearSelection}>
          Clear Selection
        </Button>
        <Button variant="outline" onClick={handleStartExercise}>
          Start Exercise
        </Button>
      </div>
      <Button variant="outline" onClick={onAddExercise}>
        Add Exercise
      </Button>
    </div>
  );
}
