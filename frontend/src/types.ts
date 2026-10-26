export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in progress' | 'completed';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
}

export interface TaskListResponse {
  total: number;
  items: Task[];
  stats: TaskStats;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface ApiError {
  message: string;
  details?: { field: string; message: string }[];
}

export interface AiSuggestResponse {
  suggested_description: string;
  source: string;
  model: string;
}
