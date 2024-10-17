import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface TodoActionsProps {
  onAddTodo: () => void;
  showFutureTodos: boolean;
  onToggleFutureTodos: () => void;
}

export function TodoActions({
  onAddTodo,
  showFutureTodos,
  onToggleFutureTodos,
}: TodoActionsProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <Button variant="outline" onClick={onAddTodo}>
        Add Todo
      </Button>
      <Button
        variant="outline"
        onClick={onToggleFutureTodos}
        className="flex items-center"
      >
        {showFutureTodos ? (
          <>
            <EyeOff className="mr-2 h-4 w-4" /> Hide Future Todos
          </>
        ) : (
          <>
            <Eye className="mr-2 h-4 w-4" /> Show All Todos
          </>
        )}
      </Button>
    </div>
  );
}
