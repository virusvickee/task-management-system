'use client';

import { MoreHorizontal, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/hooks/useTasks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DateBadgeDestructive from './ui/DateBadgeDestructive';
import { toastConfirm, toastSuccess } from '@/lib/toast';

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
  cardBg,
  textColor,
  borderColor,
  onDeleteTask,
  onDuplicateTask,
}: {
  task: Task;
  fields: Record<string, boolean>;
  cardBg?: string;
  textColor?: string;
  borderColor?: string;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onDuplicateTask?: (task: Task) => Promise<void>;
}) {
  const router = useRouter();
  const href = `/dashboard/tasks/${task._id}`;
  const useThemeClasses = cardBg === undefined;
  const bg = cardBg ?? 'var(--card-bg)';
  const tc = textColor ?? 'var(--base-primary)';
  const bc = borderColor ?? 'var(--base-border)';

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDeleteTask) return;
    toastConfirm({
      title: 'Delete task?',
      message: 'This task will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await onDeleteTask(task._id);
        toastSuccess('Task deleted');
      },
    });
  }

  async function handleDuplicate(e: React.MouseEvent) {
    e.stopPropagation();
    if (!onDuplicateTask) return;
    await onDuplicateTask(task);
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
      onMouseEnter={() => router.prefetch(href)}
      onClick={() => router.push(href)}
      className={`group hover:shadow-md transition-all duration-150 cursor-pointer${useThemeClasses ? ' kanban-task-card' : ''}`}
      style={{
        width: '273px',
        minHeight: '114px',
        padding: '12px',
        gap: '8px',
        borderRadius: 'var(--border-radius-rounded-md, 6px)',
        border: `1px solid ${bc}`,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <p className="text-[15px] font-semibold leading-snug flex-1" style={{ color: tc }}>
          {task.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              draggable={false}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 outline-none shrink-0 mt-0.5 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreHorizontal size={14} strokeWidth={2.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(href);
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

      <div className="flex items-center justify-between mb-[10px]" style={{ width: '247px', height: '20px' }}>
        {fields.members ? (
          <div className="flex items-center gap-[6px]" style={{ width: '210px', height: '20px' }}>
            <div
              className={`w-[14px] h-[14px] rounded-full shrink-0 bg-gradient-to-br ${
                task.assignee ? avatarGradient(task.assignee) : 'from-gray-300 to-gray-400'
              } flex items-center justify-center ring-1 ring-white dark:ring-gray-900`}
            >
              <span className="text-[6px] font-bold text-white leading-none">
                {task.assignee ? initials(task.assignee) : '?'}
              </span>
            </div>
            <span className="text-sm font-medium leading-snug tracking-normal truncate" style={{ color: tc }}>
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

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-[6px]" style={{ width: '247px', height: '20px' }}>
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-lg transition-colors"
              style={{ background: cardBg, border: `1px solid ${bc}`, color: tc }}
            >
              <Tag size={11} className="shrink-0" strokeWidth={2.5} style={{ color: tc }} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
