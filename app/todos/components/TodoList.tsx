'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TableComponent } from '@/components/TableComponent';
import { TodoDialog } from './TodoModal';
import { TodoActions } from './TodoActions';
import { BlogDomains } from './BlogDomains';
import { Check, FileText } from 'lucide-react';
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
  addDays,
  isBefore,
  startOfDay,
} from 'date-fns';

export default function TodoList() {
  const [todos, setTodos] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState<number[]>([]);
  const [showFutureTodos, setShowFutureTodos] = useState(false);

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
    return format(date, 'd.MM.yyyy');
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

  const toggleNoteExpansion = useCallback((id: number) => {
    setExpandedNotes((prev) =>
      prev.includes(id) ? prev.filter((noteId) => noteId !== id) : [...prev, id]
    );
  }, []);

  const todoColumns = useMemo(
    () => [
      {
        id: 'check',
        Header: '',
        Cell: ({ row }) => (
          <Check
            strokeWidth="3"
            className="text-green-500 w-4 h-4 cursor-pointer mx-auto"
            onClick={() => handleCheckClick(row.original.id)}
          />
        ),
        className: 'w-1/12',
      },
      {
        Header: 'Title',
        accessor: 'title',
        className: 'w-3/12 text-sm font-semibold h-10 !text-left',
        headerClassName: 'text-left',
      },
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }) => format(parseISO(value), 'd.MM.yyyy'),
        className: 'w-2/12 text-xs text-center',
      },
      {
        id: 'note',
        Header: 'Note',
        Cell: ({ row }) => {
          if (!row.original.note) return null;
          return (
            <FileText
              className="w-4 mx-auto cursor-pointer"
              onClick={() => toggleNoteExpansion(row.original.id)}
            />
          );
        },
        className: 'w-1/12',
      },
      {
        Header: 'Links',
        accessor: 'links',
        headerClassName: 'text-left',
        Cell: ({ value }) => (
          <div className="flex space-x-2">
            {value.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div
                  dangerouslySetInnerHTML={{ __html: link.icon }}
                  className="w-4 h-4"
                />
              </a>
            ))}
          </div>
        ),
        className: 'w-2/12',
      },
      {
        id: 'blog',
        Header: 'Blog',
        headerClassName: 'text-left',
        Cell: ({ row }) => <BlogDomains title={row.original.title} />,
        className: 'w-2/12',
      },
    ],
    [handleCheckClick, toggleNoteExpansion]
  );

  const renderSubComponent = useCallback(
    ({ row }) => (
      <div className="px-4 py-2 bg-gray-100">
        <p className="text-sm text-gray-500">{row.original.note}</p>
      </div>
    ),
    []
  );

  const filteredTodos = useMemo(() => {
    if (showFutureTodos) {
      return todos;
    }
    const dayAfterTomorrow = addDays(startOfDay(new Date()), 2);
    return todos.filter((group) =>
      isBefore(parseISO(group.date), dayAfterTomorrow)
    );
  }, [todos, showFutureTodos]);

  const toggleFutureTodos = () => {
    setShowFutureTodos(!showFutureTodos);
  };

  return (
    <div>
      <TodoActions
        onAddTodo={handleAddTodo}
        showFutureTodos={showFutureTodos}
        onToggleFutureTodos={toggleFutureTodos}
      />
      {filteredTodos.map((group) => (
        <div key={group.date} className="mb-8">
          <h2 className="text-sm font-semibold mb-3">
            {formatGroupDate(group.date)}
          </h2>
          <TableComponent
            columns={todoColumns}
            data={group.todos}
            keyField="id"
            onEdit={handleEditTodo}
            onDelete={handleDeleteTodo}
            expandedDescriptions={expandedNotes}
            onDescriptionToggle={toggleNoteExpansion}
            renderSubComponent={renderSubComponent}
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
