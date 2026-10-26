import React from 'react';
import { TaskPriority, TaskStatus } from '../types';
import { Search, Plus, X } from 'lucide-react';

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: TaskStatus | '';
  onStatusChange: (status: TaskStatus | '') => void;
  priorityFilter: TaskPriority | '';
  onPriorityChange: (priority: TaskPriority | '') => void;
  onOpenCreate: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const FilterBar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  onOpenCreate,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="controls-bar" role="search">
      <div className="filter-group">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks by title or keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        <select
          className="select-filter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus | '')}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="select-filter"
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value as TaskPriority | '')}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClearFilters}
            title="Reset filters"
          >
            <X size={14} aria-hidden="true" />
            Clear Filters
          </button>
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onOpenCreate}
      >
        <Plus size={16} aria-hidden="true" />
        Create Task
      </button>
    </div>
  );
};
