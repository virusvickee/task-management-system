'use client';

import { CalendarDays, MoreHorizontal, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/hooks/useTasks';
import { apiFetch } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DateBadgeDestructive from './ui/DateBadgeDestructive';

/* ── Avatar helpers ── */
const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-600',
  'from-emerald-400 to-teal-600',
  'from-orange-400 to-amber-500',
  'from-pink-400 to-rose-600',
  'from-blue-400 to-indigo-600',
  'from-cyan-400 to-sky-600',
];
function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function TaskCard({
  task,
  fields,
}: {
  task: Task;
  fields: Record<string, boolean>;
}) {
  const router = useRouter();

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this task?')) {
      await apiFetch(`/tasks/${task._id}`, { method: 'DELETE' });
      window.location.reload();
    }
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    await apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: `${task.title} (copy)`,
        status: task.status,
        projectId: task.projectId,
        priority: task.priority,
        assignee: task.assignee,
      }),
    });
    window.location.reload();
  }

  const dueDateFormatted = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 group hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-150 cursor-pointer"
    >
      {/* ── Title row ── */}
      <div className="flex items-start justify-between gap-2 mb-[10px]">
        <p className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 leading-snug flex-1">
          {task.title}
        </p>
        {/* ── Actions dropdown — draggable=false so it never swallows the drag pointer ── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              draggable={false}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 outline-none shrink-0 mt-0.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/tasks/${task._id}`);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>Duplicate</DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Assignee + Due Date row ── */}
      <div className="flex items-center justify-between mb-[10px]">
        {fields.members ? (
          <div className="flex items-center gap-[6px] w-[210px] h-[20px]">
            <div
              className={`w-5 h-5 rounded-full shrink-0 bg-gradient-to-br ${
                task.assignee ? avatarGradient(task.assignee) : 'from-gray-300 to-gray-400'
              } flex items-center justify-center ring-2 ring-white dark:ring-gray-900`}
            >
              <span className="text-[8px] font-bold text-white leading-none">
                {task.assignee ? initials(task.assignee) : '?'}
              </span>
            </div>
            <span className="text-[13px] font-medium text-gray-600 dark:text-gray-300 truncate">
              {task.assignee ?? 'Unassigned'}
            </span>
          </div>
        ) : (
          <span />
        )}

        {fields.dueDate && dueDateFormatted && (
          <DateBadgeDestructive badgeText={dueDateFormatted} />
        )}
      </div>

      {/* ── Tags row ── */}
      {fields.labels && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-[6px]">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[12px] font-medium px-2 py-1 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <Tag size={11} className="shrink-0 text-gray-400 dark:text-gray-500" />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
