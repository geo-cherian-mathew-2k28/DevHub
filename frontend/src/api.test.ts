import { describe, it, expect } from 'vitest';
import { api } from './api';

describe('Frontend API Client Structure', () => {
  it('exposes essential task management methods', () => {
    expect(typeof api.getTasks).toBe('function');
    expect(typeof api.getTask).toBe('function');
    expect(typeof api.createTask).toBe('function');
    expect(typeof api.updateTask).toBe('function');
    expect(typeof api.deleteTask).toBe('function');
    expect(typeof api.checkHealth).toBe('function');
    expect(typeof api.checkReadiness).toBe('function');
    expect(typeof api.suggestDescription).toBe('function');
  });
});
