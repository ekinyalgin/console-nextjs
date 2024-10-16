'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TodoDialog } from './TodoDialog';
import { columns } from './columns';
import {
  addDays,
  format,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
} from 'date-fns';

export default function TodosPage() {
  const [todos, setTodos] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (response.ok) {
        const data = await response.json();
        const groupedTodos = groupTodosByDate(data);
        setTodos(groupedTodos);
      } else {
        console.error('Failed to fetch todos');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const groupTodosByDate = (todos) => {
    const grouped = todos.reduce((acc, todo) => {
      const dateKey = format(parseISO(todo.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(todo);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, todos]) => ({
        date,
        todos,
      }))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  };

  const formatGroupDate = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMMM d, yyyy');
  };

  const handleCheckClick = async (id) => {
    try {
      const allTodos = todos.flatMap((group) => group.todos);
      const todo = allTodos.find((t) => t.id === id);

      if (!todo) {
        console.error('Todo not found', id);
        return;
      }

      const newDate = addDays(parseISO(todo.date), 1);

      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...todo,
          date: newDate.toISOString(),
          links: todo.links.map((link) => ({ url: link.url, icon: link.icon })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update todo date:', errorData.message);
        return;
      }

      console.log('Todo updated successfully');

      // Listeyi güncelle
      await fetchTodos();
    } catch (error) {
      console.error('Error updating todo date:', error);
    }
  };

  const handleAddTodo = () => {
    setEditingTodo(null);
    setIsDialogOpen(true);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setIsDialogOpen(true);
  };

  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchTodos();
      } else {
        console.error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleSaveTodo = async (todoData) => {
    try {
      const url = editingTodo ? `/api/todos/${editingTodo.id}` : '/api/todos';
      const method = editingTodo ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        fetchTodos();
      } else {
        console.error('Failed to save todo');
      }
    } catch (error) {
      console.error('Error saving todo:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Todos</h1>
        <Button onClick={handleAddTodo}>
          <Plus className="mr-2 h-4 w-4" /> Add Todo
        </Button>
      </div>
      {todos.map((group) => (
        <div key={group.date} className="mb-8">
          <h2 className="text-sm font-semibold mb-3">
            {formatGroupDate(group.date)}
          </h2>
          <DataTable
            columns={columns}
            data={group.todos.map((todo) => ({
              ...todo,
              onCheckClick: handleCheckClick,
            }))}
            keyField="id"
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
          />
        </div>
      ))}
      <TodoDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveTodo}
        todo={editingTodo}
      />
    </div>
  );
}
