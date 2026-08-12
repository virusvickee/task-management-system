'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, guestLogin } from '@/lib/api';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  members?: string[];
  tags: string[];
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  projectId?: string;
  parentTaskId?: string;
  team?: string;
  reporterName?: string;
  locked?: boolean;
  resources?: { title: string; url: string }[];
  subtasks?: Task[];
  comments?: {
    _id?: string;
    author: string;
    text: string;
    createdAt: string;
    reactions?: string[];
    attachments?: { name: string; dataUrl: string; type: string }[];
  }[];
}

export const STATUSES = ['To Do', 'Doing', 'Completed', 'On Hold'] as const;
export type Status = (typeof STATUSES)[number];

async function ensureAuth() {
  if (!localStorage.getItem('tms-token')) await guestLogin();
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    ensureAuth()
      .then(() => apiFetch(projectId ? `/tasks?projectId=${projectId}` : '/tasks'))
      .then(setTasks)
      .catch(console.error);
  }, [projectId]);

  const refetch = useCallback(() => {
    return ensureAuth()
      .then(() => apiFetch(projectId ? `/tasks?projectId=${projectId}` : '/tasks'))
      .then(setTasks)
      .catch(console.error);
  }, [projectId]);

  const tasksByColumn = Object.fromEntries(
    STATUSES.map((s) => [s, tasks.filter((t) => t.status === s)]),
  ) as Record<Status, Task[]>;

  const createTask = useCallback(async (title: string, status: Status = 'To Do') => {
    const optimistic: Task = { _id: `tmp-${Date.now()}`, title, status, tags: [], projectId };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, status, projectId }),
      });
      setTasks((prev) => prev.map((t) => (t._id === optimistic._id ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t._id !== optimistic._id));
    }
  }, [projectId]);

  const updateTask = useCallback(async (id: string, partialFields: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, ...partialFields } : t)));
    try {
      await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(partialFields) });
    } catch {
      // revert on failure — refetch
      apiFetch(projectId ? `/tasks?projectId=${projectId}` : '/tasks')
        .then(setTasks)
        .catch(console.error);
    }
  }, [projectId]);

  return { tasks, tasksByColumn, createTask, updateTask, refetch };
}
