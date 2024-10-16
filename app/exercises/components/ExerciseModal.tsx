import React, { useState, useEffect, useRef } from 'react';
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
import { Upload } from 'lucide-react';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exercise: Partial<Exercise>) => void;
  exercise?: Exercise | null;
  mode: 'add' | 'edit';
}

export function ExerciseModal({
  isOpen,
  onClose,
  onSubmit,
  exercise,
  mode,
}: ExerciseModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (exercise && mode === 'edit') {
      setTitle(exercise.title);
      setDuration(exercise.duration);
      setDescription(exercise.description || '');
      setVideoUrl(exercise.videoUrl || '');
    } else {
      resetForm();
    }
  }, [exercise, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const exerciseData: Partial<Exercise> = {
      title,
      duration,
      description,
      videoUrl,
    };
    if (mode === 'edit' && exercise) {
      exerciseData.id = exercise.id;
    }
    onSubmit(exerciseData);
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

  const resetForm = () => {
    setTitle('');
    setDuration('');
    setDescription('');
    setVideoUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const response = await fetch('/api/exercises/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });

        if (response.ok) {
          const importedExercises = await response.json();
          importedExercises.forEach(onSubmit);
          resetForm();
          onClose();
        } else {
          const error = await response.json();
          throw new Error(error.error || 'Failed to import exercises');
        }
      } catch (error) {
        console.error('Error importing exercises:', error);
        // You can add error notification here
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Exercise' : 'Edit Exercise'}
          </DialogTitle>
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
            <Button type="submit">
              {mode === 'add' ? 'Add Exercise' : 'Update Exercise'}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
        {mode === 'add' && (
          <div className="flex items-center justify-between mt-4 space-x-2">
            <Input
              type="file"
              className="grow"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
            />
            {selectedFile && (
              <Button onClick={handleImport} className="w-60 flex items-center">
                <Upload className="w-4 h-4 mr-2" /> Import JSON
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
