'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch, guestLogin } from '@/lib/api';

export interface Project {
  _id: string;
  name: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
  lead?: string;
  dueDate?: string;
}

async function ensureAuth() {
  if (!localStorage.getItem('tms-token')) await guestLogin();
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ensureAuth()
      .then(() => apiFetch('/projects'))
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const createProject = useCallback(async (name: string) => {
    const optimistic: Project = {
      _id: `tmp-${Date.now()}`,
      name,
      priority: 'No Priority',
      lead: 'You',
    };
    setProjects((prev) => [optimistic, ...prev]);
    try {
      const created = await apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setProjects((prev) => prev.map((p) => (p._id === optimistic._id ? created : p)));
    } catch {
      setProjects((prev) => prev.filter((p) => p._id !== optimistic._id));
    }
  }, []);

  const updateProject = useCallback(async (id: string, partialFields: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p._id === id ? { ...p, ...partialFields } : p)));
    try {
      await apiFetch(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(partialFields),
      });
    } catch {
      apiFetch('/projects').then(setProjects).catch(console.error);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p._id !== id));
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    } catch {
      apiFetch('/projects').then(setProjects).catch(console.error);
    }
  }, []);

  return { projects, loading, createProject, updateProject, deleteProject };
}
