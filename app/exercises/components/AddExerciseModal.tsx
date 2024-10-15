import React, { useState, useRef } from 'react';
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
import { X, Upload } from 'lucide-react';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseAdded: (exercise: Exercise) => void;
}

export function AddExerciseModal({
  isOpen,
  onClose,
  onExerciseAdded,
}: AddExerciseModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          duration,
          description,
          videoUrl,
        }),
      });

      if (response.ok) {
        const newExercise = await response.json();
        onExerciseAdded(newExercise);
        resetForm();
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add exercise');
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
      // You can add error notification here
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
          importedExercises.forEach(onExerciseAdded);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add New Exercise</DialogTitle>
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
            <Button type="submit">Add Exercise</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
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
      </DialogContent>
    </Dialog>
  );
}
