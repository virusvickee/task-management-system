'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/context/theme-context';
import { useRouter } from 'next/navigation';

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
}

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!localStorage.getItem('tms-token')) {
      router.replace('/');
      return;
    }

    async function loadTasks() {
      try {
        const data = await apiFetch('/tasks');
        setTasks(data);
      } catch {
        // Token expired or invalid — redirect to login
        localStorage.removeItem('tms-token');
        localStorage.removeItem('tms-user');
        router.replace('/');
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Task Management System</h1>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-md border border-current text-sm"
        >
          {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
        </button>
      </div>

      {loading ? (
        <p>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="opacity-70">No tasks yet.</p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task._id} className="border rounded-md p-4">
              <p className="font-medium">{task.title}</p>
              <p className="text-sm opacity-70">
                {task.status} · {task.priority}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
