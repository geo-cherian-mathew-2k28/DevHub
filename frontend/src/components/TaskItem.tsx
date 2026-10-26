import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { Calendar, Check, Edit3, Trash2 } from 'lucide-react';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, newStatus: TaskStatus) => void;
}

export const TaskItem: React.FC<Props> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'badge-priority-high';
      case 'medium':
        return 'badge-priority-medium';
      case 'low':
      default:
        return 'badge-priority-low';
    }
  };

  const getStatusClass = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return 'badge-status-completed';
      case 'in progress':
        return 'badge-status-in-progress';
      case 'pending':
      default:
        return 'badge-status-pending';
    }
  };

  const isCompleted = task.status === 'completed';

  return (
    <article
      className={`task-card ${isCompleted ? 'completed' : ''}`}
      aria-label={`Task: ${task.title}`}
    >
      <div className="task-top">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-badges">
          <span className={`badge ${getPriorityClass(task.priority)}`}>
            {task.priority} priority
          </span>
          <span className={`badge ${getStatusClass(task.status)}`}>
            {task.status}
          </span>
        </div>
      </div>

      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Calendar size={13} aria-hidden="true" />
          <span>Created: {formatDate(task.created_at)}</span>
        </div>

        <div className="task-actions">
          {/* Quick status cycle button */}
          {task.status !== 'completed' ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onStatusChange(task.id, 'completed')}
              title="Mark as completed"
            >
              <Check size={14} color="#16a34a" aria-hidden="true" />
              Complete
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onStatusChange(task.id, 'pending')}
              title="Re-open task"
            >
              Reopen
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(task)}
            title="Edit task"
            aria-label={`Edit ${task.title}`}
          >
            <Edit3 size={14} aria-hidden="true" />
            Edit
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
};
