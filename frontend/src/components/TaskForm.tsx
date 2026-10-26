import React, { useState, useEffect } from 'react';
import { Task, TaskCreateInput, TaskPriority, TaskStatus } from '../types';
import { api } from '../api';
import { Sparkles, X } from 'lucide-react';

interface Props {
  initialTask?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: TaskCreateInput) => Promise<void>;
}

export const TaskForm: React.FC<Props> = ({
  initialTask,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setStatus(initialTask.status);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('pending');
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!title.trim()) {
      setError('Please provide a task title first so the AI assistant has context.');
      return;
    }

    try {
      setIsGeneratingAi(true);
      setError(null);
      const res = await api.suggestDescription(title.trim());
      setDescription(res.suggested_description);
    } catch (err: any) {
      setError(err.message || 'Could not fetch AI suggestion.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="modal-title">{initialTask ? 'Edit Task' : 'Create New Task'}</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="task-title" className="form-label">
                Title <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="task-title"
                type="text"
                className="form-control"
                placeholder="e.g. Build multi-stage Docker image"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="task-desc" className="form-label">
                  Description (Optional)
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAiSuggest}
                  disabled={isGeneratingAi || !title.trim()}
                  title="Docker Model Runner / Educational assistant"
                >
                  <Sparkles size={13} color="#9333ea" aria-hidden="true" />
                  {isGeneratingAi ? 'Generating...' : 'Suggest with AI'}
                </button>
              </div>
              <textarea
                id="task-desc"
                className="form-control"
                rows={3}
                placeholder="Add details, acceptance criteria, or command instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="task-priority" className="form-label">
                  Priority
                </label>
                <select
                  id="task-priority"
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="task-status" className="form-label">
                  Status
                </label>
                <select
                  id="task-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="in progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
