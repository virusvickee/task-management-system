'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, guestLogin } from '@/lib/api';

export interface Task {
  _id: string;
  title: string;
  status: string;
  assignee?: string;
  tags: string[];
  startDate?: string;
  endDate?: string;
  dueDate?: string;
}

export const STATUSES = ['To Do', 'Doing', 'Completed', 'On Hold'] as const;
export type Status = (typeof STATUSES)[number];

async function ensureAuth() {
  if (!localStorage.getItem('tms-token')) await guestLogin();
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    ensureAuth()
      .then(() => apiFetch('/tasks'))
      .then(setTasks)
      .catch(console.error);
  }, []);

  const tasksByColumn = Object.fromEntries(
    STATUSES.map((s) => [s, tasks.filter((t) => t.status === s)]),
  ) as Record<Status, Task[]>;

  const createTask = useCallback(async (title: string, status: Status = 'To Do') => {
    const optimistic: Task = { _id: `tmp-${Date.now()}`, title, status, tags: [] };
    setTasks((prev) => [optimistic, ...prev]);
    try {
      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, status }),
      });
      setTasks((prev) => prev.map((t) => (t._id === optimistic._id ? created : t)));
    } catch {
      setTasks((prev) => prev.filter((t) => t._id !== optimistic._id));
    }
  }, []);

  const updateTaskStatus = useCallback(async (id: string, status: Status) => {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status } : t)));
    try {
      await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    } catch {
      // revert on failure — refetch
      apiFetch('/tasks').then(setTasks).catch(console.error);
    }
  }, []);

  return { tasksByColumn, createTask, updateTaskStatus };
}
