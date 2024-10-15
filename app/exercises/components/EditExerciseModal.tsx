import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Exercise } from '@prisma/client';
import { X } from 'lucide-react';

interface EditExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onExerciseUpdated: (exercise: Exercise) => void;
}

export function EditExerciseModal({
  isOpen,
  onClose,
  exercise,
  onExerciseUpdated,
}: EditExerciseModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (exercise) {
      setTitle(exercise.title);
      setDuration(exercise.duration);
      setDescription(exercise.description || '');
      setVideoUrl(exercise.videoUrl || '');
    }
  }, [exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise) return;

    const updatedExercise = {
      ...exercise,
      title,
      duration,
      description,
      videoUrl,
    };

    onExerciseUpdated(updatedExercise);
  };

  const convertSecondsToMinutesAndSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const convertDurationToSeconds = (durationString: string): number => {
    const [minutes, seconds] = durationString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let numericValue = value.replace(/\D/g, '');
    if (numericValue.length > 4) {
      numericValue = numericValue.substring(0, 4);
    }
    if (numericValue.length >= 3) {
      const formattedValue =
        numericValue.substring(0, 2) + ':' + numericValue.substring(2);
      setDuration(formattedValue);
    } else {
      setDuration(numericValue);
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Exercise</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            required
            maxLength={60}
          />
          <Input
            placeholder="Duration (MM:SS)"
            value={duration}
            onChange={handleDurationChange}
            required
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input
            placeholder="Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <div className="flex justify-between">
            <Button type="submit">Update Exercise</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
