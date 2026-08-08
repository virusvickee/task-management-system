import { BarChart2, CalendarDays, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Task } from '@/hooks/useTasks';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const PRIORITY_COLORS: Record<string, string> = {
  'Urgent':      'text-red-600',
  'High':        'text-red-500',
  'Medium':      'text-orange-500',
  'Low':         'text-gray-400',
  'No Priority': 'text-gray-300',
};

export default function TaskCard({ task, fields }: { task: Task; fields: Record<string, boolean> }) {
  const router = useRouter();

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
      className="bg-white rounded-lg border border-gray-200 px-3 py-3 group hover:shadow-sm transition-shadow duration-150 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <p className="text-sm font-medium text-gray-800 leading-snug">{task.title}</p>
        <div className="flex items-center gap-1 shrink-0 mt-px">
          {fields.priority && task.priority && task.priority !== 'No Priority' && (
            <BarChart2
              size={13}
              className={PRIORITY_COLORS[task.priority] ?? 'text-gray-300'}
              aria-label={task.priority}
            />
          )}
          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        {fields.members ? (
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded-full shrink-0 ${task.assignee ? avatarColor(task.assignee) : 'bg-gray-300'}`} />
            <span className="text-[12px] text-gray-600">{task.assignee ?? 'Unassigned'}</span>
          </div>
        ) : <span />}
        {fields.dueDate && task.dueDate && (
          <div className="flex items-center gap-1 bg-orange-50 text-orange-500 text-[11px] font-medium px-2 py-0.5 rounded-full">
            <CalendarDays size={11} />
            <span>{new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {fields.labels && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
