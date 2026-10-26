import {
  Task,
  TaskListResponse,
  TaskCreateInput,
  TaskUpdateInput,
  TaskPriority,
  TaskStatus,
  AiSuggestResponse,
} from './types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 204) {
        return null as unknown as T;
      }

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If non-JSON response
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend API at ${url}. Is the service running?`);
      }
      throw err;
    }
  }

  async getTasks(params?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    q?: string;
  }): Promise<TaskListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.q) query.set('q', params.q);

    const queryString = query.toString();
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    return this.request<TaskListResponse>(endpoint);
  }

  async getTask(id: number): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(task: TaskCreateInput): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: number, updates: TaskUpdateInput): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: number): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async checkHealth(): Promise<{ status: string; service: string }> {
    return this.request<{ status: string; service: string }>('/health');
  }

  async checkReadiness(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/ready');
  }

  async suggestDescription(title: string): Promise<AiSuggestResponse> {
    return this.request<AiSuggestResponse>('/ai/suggest-description', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }
}

export const api = new ApiClient();
