import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStats, TaskPriority, TaskStatus, TaskCreateInput } from './types';
import { api } from './api';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { TaskItem } from './components/TaskItem';
import { TaskForm } from './components/TaskForm';
import { Layers, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [systemOnline, setSystemOnline] = useState<boolean | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await api.getTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        q: searchQuery.trim() || undefined,
      });

      setTasks(res.items);
      setStats(res.stats);
      setSystemOnline(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to DevHub backend.');
      setSystemOnline(false);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateOrUpdate = async (input: TaskCreateInput) => {
    if (editingTask) {
      await api.updateTask(editingTask.id, input);
      showNotification(`Task "${input.title}" updated successfully.`);
    } else {
      await api.createTask(input);
      showNotification(`Task "${input.title}" created successfully.`);
    }
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!window.confirm(`Are you sure you want to delete "${taskToDelete?.title || 'this task'}"?`)) {
      return;
    }

    try {
      await api.deleteTask(id);
      showNotification('Task deleted successfully.');
      fetchTasks();
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete task.', 'error');
    }
  };

  const handleStatusChange = async (id: number, newStatus: TaskStatus) => {
    try {
      await api.updateTask(id, { status: newStatus });
      fetchTasks();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update status.', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const hasActiveFilters = Boolean(searchQuery || statusFilter || priorityFilter);

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="logo-badge">
            <Layers size={20} aria-hidden="true" />
            <span>DevHub</span>
          </div>
          <div className="title-group">
            <h1>Task Management Dashboard</h1>
            <p>Practical Docker &amp; Kubernetes Workshop Platform</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="system-status">
            <span
              className={`status-dot ${
                systemOnline === true ? 'online' : systemOnline === false ? 'offline' : ''
              }`}
            />
            <span>
              {systemOnline === true
                ? 'Backend & Database Connected'
                : systemOnline === false
                ? 'Backend Offline'
                : 'Checking Health...'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTasks}
            title="Refresh tasks from PostgreSQL"
            aria-label="Refresh tasks"
          >
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      {/* Global Notifications */}
      {notification && (
        <div
          className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`}
          role="status"
        >
          {notification.type === 'success' ? (
            <CheckCircle size={16} aria-hidden="true" />
          ) : (
            <AlertCircle size={16} aria-hidden="true" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Database Connection Error */}
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>Connection Error:</strong> {error}
            <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
              Ensure your Docker Compose containers are up: <code>docker compose up -d</code>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTasks}
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <DashboardStats stats={stats} />

      {/* Action Controls & Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        onOpenCreate={handleOpenCreate}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Main Task List */}
      <main>
        {isLoading && tasks.length === 0 ? (
          <div className="loading-spinner" role="status">
            <Loader2 size={24} className="spin" aria-hidden="true" />
            <span>Loading tasks from PostgreSQL database...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>
              {hasActiveFilters
                ? 'No tasks match your current filter criteria. Try clearing the filters.'
                : 'Get started by creating your first task in the PostgreSQL database!'}
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
                onClick={handleOpenCreate}
              >
                Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="tasks-container" aria-label="Task list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      <TaskForm
        isOpen={isModalOpen}
        initialTask={editingTask}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Footer Educational Reference */}
      <footer
        style={{
          marginTop: '3.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <strong>DevHub Architecture:</strong> React/Vite + Nginx (Port 3000) &rarr; FastAPI (Port 8000) &rarr; PostgreSQL (Port 5432)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="workshop-badge">Docker Compose</span>
          <span className="workshop-badge">Kubernetes (kind)</span>
          <span className="workshop-badge">Docker Scout</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
