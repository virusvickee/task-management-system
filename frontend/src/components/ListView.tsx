'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, SignalLow } from 'lucide-react';
import type { Task, Status } from '@/hooks/useTasks';

/* ── Avatar ── */
function Avatar({ name }: { name: string }) {
  const COLORS = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`w-6 h-6 rounded-full ${COLORS[h % COLORS.length]} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>
      {initials}
    </span>
  );
}

/* ── Priority cell ── */
const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  'Urgent':      { color: 'text-red-600',    label: 'Urgent' },
  'High':        { color: 'text-red-500',    label: 'High' },
  'Medium':      { color: 'text-orange-500', label: 'Medium' },
  'Low':         { color: 'text-gray-400',   label: 'Low' },
  'No Priority': { color: 'text-gray-400',   label: '—' },
};

function Priority({ value }: { value?: string }) {
  const p = PRIORITY_CONFIG[value || 'No Priority'] || PRIORITY_CONFIG['No Priority'];
  return <span className={`text-[12px] ${p.color} flex items-center gap-1 font-medium`}><SignalLow size={12} />{p.label}</span>;
}

/* ── Status section ── */
function StatusSection({
  status, tasks, onAddTask, searching, fields,
}: {
  status: Status;
  tasks: Task[];
  onAddTask: (title: string, status: Status) => void;
  searching: boolean;
  fields: Record<string, boolean>;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = searching ? false : collapsed;
  const [adding, setAdding] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitAdd() {
    const t = inputVal.trim();
    if (t) onAddTask(t, status);
    setInputVal('');
    setAdding(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitAdd();
    if (e.key === 'Escape') { setInputVal(''); setAdding(false); }
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        {isCollapsed
          ? <ChevronRight size={14} className="text-gray-400 shrink-0" />
          : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
        <span className="text-sm font-medium text-gray-800">{status}</span>
        <span className="text-[11px] text-gray-400 font-medium bg-gray-100 rounded-full px-1.5 py-0.5 leading-none ml-1">
          {tasks.length}
        </span>
      </button>

      {!isCollapsed && (
        <>
          {/* Table */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 w-full">Task</th>
                {fields.priority && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Priority</th>}
                {fields.members && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Members</th>}
                {fields.dueDate && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Due Date</th>}
                {fields.labels && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Labels</th>}
                {fields.status && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Status</th>}
                {fields.reporter && <th className="text-left px-4 py-2 text-[12px] font-medium text-gray-500 whitespace-nowrap">Reporter</th>}
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors h-12 cursor-pointer" onClick={() => router.push(`/dashboard/tasks/${task._id}`)}>
                  <td className="px-4 py-2 text-sm text-gray-900">{task.title}</td>
                  {fields.priority && <td className="px-4 py-2"><Priority value={task.priority} /></td>}
                  {fields.members && (
                    <td className="px-4 py-2">
                      {task.assignee
                        ? <Avatar name={task.assignee} />
                        : <span className="w-6 h-6 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400"><Plus size={10} /></span>}
                    </td>
                  )}
                  {fields.dueDate && (
                    <td className="px-4 py-2 text-[13px] text-gray-700 whitespace-nowrap">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  {fields.labels && (
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-1">
                        {task.tags.map((t) => <span key={t} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{t}</span>)}
                      </div>
                    </td>
                  )}
                  {fields.status && <td className="px-4 py-2 text-[13px] text-gray-700 whitespace-nowrap">{task.status}</td>}
                  {fields.reporter && <td className="px-4 py-2 text-[13px] text-gray-500">You</td>}
                  <td className="px-4 py-2 text-right">
                    <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add task row */}
          <div className="px-4 py-2 border-t border-gray-100">
            {adding ? (
              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                onBlur={commitAdd}
                placeholder="Task title…"
                className="w-full text-sm text-gray-800 placeholder-gray-400 outline-none border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-200"
              />
            ) : (
              <button
                onClick={startAdding}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                <Plus size={13} />
                Add Task
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── List view root ── */
export default function ListView({
  tasksByColumn,
  onAddTask,
  query,
  fields,
}: {
  tasksByColumn: Record<Status, Task[]>;
  onAddTask: (title: string, status: Status) => void;
  query: string;
  fields: Record<string, boolean>;
}) {
  const STATUSES: Status[] = ['To Do', 'Doing', 'Completed', 'On Hold'];
  const searching = query.length > 0;
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {STATUSES.filter((s) => !searching || tasksByColumn[s].length > 0).map((s) => (
        <StatusSection key={s} status={s} tasks={tasksByColumn[s]} onAddTask={onAddTask} searching={searching} fields={fields} />
      ))}
    </div>
  );
}
