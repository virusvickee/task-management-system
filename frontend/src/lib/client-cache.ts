import type { Task } from '@/hooks/useTasks';
import type { Project } from '@/hooks/useProjects';

const TTL_MS = 60_000;

type Entry<T> = { data: T; ts: number };

const taskLists = new Map<string, Entry<Task[]>>();
const taskDetails = new Map<string, Entry<Task>>();
let projectsCache: Entry<Project[]> | null = null;

function isFresh<T>(entry: Entry<T> | null | undefined) {
  return Boolean(entry && Date.now() - entry.ts < TTL_MS);
}

export function tasksCacheKey(projectId?: string) {
  return projectId ?? '__all__';
}

export function readTasksList(projectId?: string): Task[] | null {
  const entry = taskLists.get(tasksCacheKey(projectId));
  return isFresh(entry) ? entry!.data : null;
}

export function writeTasksList(projectId: string | undefined, data: Task[]) {
  taskLists.set(tasksCacheKey(projectId), { data, ts: Date.now() });
  for (const task of data) {
    taskDetails.set(task._id, { data: task, ts: Date.now() });
  }
}

export function readTaskDetail(id: string): Task | null {
  const direct = taskDetails.get(id);
  if (isFresh(direct)) return direct!.data;

  for (const entry of taskLists.values()) {
    if (!isFresh(entry)) continue;
    const match = entry.data.find((task) => task._id === id);
    if (match) return match;
  }
  return null;
}

export function writeTaskDetail(task: Task) {
  taskDetails.set(task._id, { data: task, ts: Date.now() });
}

export function patchCachedTask(id: string, partial: Partial<Task>) {
  const detail = taskDetails.get(id);
  if (detail) {
    taskDetails.set(id, { data: { ...detail.data, ...partial }, ts: Date.now() });
  }
  for (const [key, entry] of taskLists.entries()) {
    taskLists.set(key, {
      data: entry.data.map((task) => (task._id === id ? { ...task, ...partial } : task)),
      ts: Date.now(),
    });
  }
}

export function readProjectsList(): Project[] | null {
  return isFresh(projectsCache) ? projectsCache!.data : null;
}

export function writeProjectsList(data: Project[]) {
  projectsCache = { data, ts: Date.now() };
}
