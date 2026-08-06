import { useState, useEffect } from 'react';
import { Plus, Check, X, Clock, AlertCircle } from 'lucide-react';
import { Modal, FormField } from './Modal';

interface Todo {
  id: number;
  clientId: number | null;
  instanceId: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  createdAt: Date;
}

interface TodosPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIORITY_COLORS = {
  low: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
  medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
  high: 'text-red-600 bg-red-100 dark:bg-red-900/20',
};

const STATUS_ICONS = {
  pending: Clock,
  in_progress: AlertCircle,
  done: Check,
};

export function TodosPanel({ isOpen, onClose }: TodosPanelProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTodos();
    }
  }, [isOpen, filter]);

  const fetchTodos = async () => {
    const url =
      filter === 'all' ? '/api/todos' : `/api/todos?status=${filter}`;
    const response = await fetch(url);
    const data = await response.json();
    setTodos(data);
  };

  const handleCreateTodo = async (formData: FormData) => {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: formData.get('title'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        dueDate: formData.get('dueDate') || null,
      }),
    });

    if (response.ok) {
      fetchTodos();
      setIsAddingTodo(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    await fetch('/api/todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });

    fetchTodos();
  };

  const handleDeleteTodo = async (id: number) => {
    if (confirm('¿Eliminar este TODO?')) {
      await fetch('/api/todos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      fetchTodos();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                TODOs
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {todos.length} tareas
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            {['all', 'pending', 'in_progress', 'done'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {status === 'all' ? 'Todos' : status.replace('_', ' ')}
              </button>
            ))}

            <button
              onClick={() => setIsAddingTodo(true)}
              className="ml-auto flex items-center gap-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {todos.map((todo) => {
              const StatusIcon = STATUS_ICONS[todo.status as keyof typeof STATUS_ICONS];
              return (
                <div
                  key={todo.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start gap-3">
                    <StatusIcon className="w-5 h-5 mt-1 text-gray-400" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {todo.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            PRIORITY_COLORS[todo.priority as keyof typeof PRIORITY_COLORS]
                          }`}
                        >
                          {todo.priority}
                        </span>
                      </div>
                      {todo.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {todo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        {todo.status !== 'done' && (
                          <button
                            onClick={() => handleUpdateStatus(todo.id, 'done')}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Completar
                          </button>
                        )}
                        {todo.status === 'pending' && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(todo.id, 'in_progress')
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Iniciar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {todos.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No hay TODOs {filter !== 'all' && `con estado "${filter}"`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de agregar TODO */}
      <Modal
        isOpen={isAddingTodo}
        onClose={() => setIsAddingTodo(false)}
        title="Nuevo TODO"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateTodo(new FormData(e.currentTarget));
          }}
        >
          <FormField
            label="Título"
            name="title"
            value=""
            onChange={() => {}}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <FormField
            label="Prioridad"
            name="priority"
            type="select"
            value="medium"
            onChange={() => {}}
            options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
            ]}
          />
          <FormField
            label="Fecha límite"
            name="dueDate"
            type="date"
            value=""
            onChange={() => {}}
          />

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => setIsAddingTodo(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
