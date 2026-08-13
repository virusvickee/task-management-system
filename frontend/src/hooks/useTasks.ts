'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { readTasksList, writeTasksList, patchCachedTask } from '@/lib/client-cache';

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

function isTempId(id: string) {
  return id.startsWith('tmp-');
}

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>(() => readTasksList(projectId) ?? []);
  const [loading, setLoading] = useState(() => !readTasksList(projectId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback((options?: { background?: boolean }) => {
    const background = options?.background ?? Boolean(readTasksList(projectId));
    if (background) setRefreshing(true);
    else {
      setLoading(true);
      setError(null);
    }

    return apiFetch(projectId ? `/tasks?projectId=${projectId}` : '/tasks')
      .then((data: Task[]) => {
        writeTasksList(projectId, data);
        setTasks(data);
        setError(null);
      })
      .catch((err: Error) => {
        console.error(err);
        if (!background) {
          setError(err.message || 'Failed to load tasks');
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [projectId]);

  useEffect(() => {
    const initial = readTasksList(projectId);
    if (initial) {
      setTasks(initial);
      setLoading(false);
      refetch({ background: true });
      return;
    }
    refetch();
  }, [projectId, refetch]);

  const tasksByColumn = Object.fromEntries(
    STATUSES.map((s) => [s, tasks.filter((t) => t.status === s)]),
  ) as Record<Status, Task[]>;

  const createTask = useCallback(async (title: string, status: Status = 'To Do') => {
    const optimistic: Task = { _id: `tmp-${Date.now()}`, title, status, tags: [], projectId };
    setTasks((prev) => {
      const next = [optimistic, ...prev];
      writeTasksList(projectId, next);
      return next;
    });
    try {
      const created = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, status, projectId }),
      });
      setTasks((prev) => {
        const next = prev.map((t) => (t._id === optimistic._id ? created : t));
        writeTasksList(projectId, next);
        return next;
      });
    } catch {
      setTasks((prev) => {
        const next = prev.filter((t) => t._id !== optimistic._id);
        writeTasksList(projectId, next);
        return next;
      });
    }
  }, [projectId]);

  const updateTask = useCallback(async (id: string, partialFields: Partial<Task>) => {
    if (isTempId(id)) return;
    setTasks((prev) => {
      const next = prev.map((t) => (t._id === id ? { ...t, ...partialFields } : t));
      writeTasksList(projectId, next);
      patchCachedTask(id, partialFields);
      return next;
    });
    try {
      await apiFetch(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(partialFields) });
    } catch {
      refetch({ background: true });
    }
  }, [projectId, refetch]);

  const removeTask = useCallback(async (id: string) => {
    if (isTempId(id)) return;
    const snapshot = tasks;
    setTasks((prev) => {
      const next = prev.filter((t) => t._id !== id);
      writeTasksList(projectId, next);
      return next;
    });
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
    } catch {
      setTasks(snapshot);
      writeTasksList(projectId, snapshot);
    }
  }, [projectId, tasks]);

  const duplicateTask = useCallback(async (task: Task) => {
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: `${task.title} (copy)`,
        status: task.status,
        projectId: task.projectId,
        priority: task.priority,
        assignee: task.assignee,
        tags: task.tags,
        team: task.team,
      }),
    });
    await refetch({ background: true });
  }, [refetch]);

  return {
    tasks,
    tasksByColumn,
    loading,
    refreshing,
    error,
    createTask,
    updateTask,
    removeTask,
    duplicateTask,
    refetch,
  };
}
