'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { readProjectsList, writeProjectsList } from '@/lib/client-cache';

export interface Project {
  _id: string;
  name: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
  lead?: string;
  dueDate?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => readProjectsList() ?? []);
  const [loading, setLoading] = useState(() => !readProjectsList());

  const loadProjects = useCallback((background = Boolean(readProjectsList())) => {
    if (!background) setLoading(true);
    return apiFetch('/projects')
      .then((data: Project[]) => {
        writeProjectsList(data);
        setProjects(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const initial = readProjectsList();
    if (initial) {
      setProjects(initial);
      setLoading(false);
      loadProjects(true);
      return;
    }
    loadProjects(false);
  }, [loadProjects]);

  const createProject = useCallback(async (name: string) => {
    const optimistic: Project = {
      _id: `tmp-${Date.now()}`,
      name,
      priority: 'No Priority',
      lead: 'You',
    };
    setProjects((prev) => {
      const next = [optimistic, ...prev];
      writeProjectsList(next);
      return next;
    });
    try {
      const created = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setProjects((prev) => {
        const next = prev.map((p) => (p._id === optimistic._id ? created : p));
        writeProjectsList(next);
        return next;
      });
    } catch {
      setProjects((prev) => {
        const next = prev.filter((p) => p._id !== optimistic._id);
        writeProjectsList(next);
        return next;
      });
    }
  }, []);

  const updateProject = useCallback(async (id: string, partialFields: Partial<Project>) => {
    if (id.startsWith('tmp-')) return;
    setProjects((prev) => {
      const next = prev.map((p) => (p._id === id ? { ...p, ...partialFields } : p));
      writeProjectsList(next);
      return next;
    });
    try {
      const updated = await apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(partialFields),
      });
      setProjects((prev) => {
        const next = prev.map((p) => (p._id === id ? updated : p));
        writeProjectsList(next);
        return next;
      });
    } catch {
      loadProjects(true);
    }
  }, [loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    if (id.startsWith('tmp-')) return;
    setProjects((prev) => {
      const next = prev.filter((p) => p._id !== id);
      writeProjectsList(next);
      return next;
    });
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    } catch {
      loadProjects(true);
    }
  }, [loadProjects]);

  return { projects, loading, createProject, updateProject, deleteProject };
}
