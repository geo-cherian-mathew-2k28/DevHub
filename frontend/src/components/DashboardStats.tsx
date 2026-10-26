import React from 'react';
import { TaskStats } from '../types';
import { CheckCircle2, Clock, ListTodo, PlayCircle } from 'lucide-react';

interface Props {
  stats: TaskStats;
}

export const DashboardStats: React.FC<Props> = ({ stats }) => {
  return (
    <section className="stats-grid" aria-label="Task metrics dashboard">
      <div className="stat-card">
        <div className="stat-header">
          <span>Total Tasks</span>
          <ListTodo size={18} aria-hidden="true" />
        </div>
        <div className="stat-value">{stats.total}</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span>Pending</span>
          <Clock size={18} aria-hidden="true" color="#64748b" />
        </div>
        <div className="stat-value">{stats.pending}</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span>In Progress</span>
          <PlayCircle size={18} aria-hidden="true" color="#2563eb" />
        </div>
        <div className="stat-value">{stats.in_progress}</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <span>Completed</span>
          <CheckCircle2 size={18} aria-hidden="true" color="#16a34a" />
        </div>
        <div className="stat-value">{stats.completed}</div>
      </div>
    </section>
  );
};
