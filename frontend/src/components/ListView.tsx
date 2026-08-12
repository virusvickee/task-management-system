'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, SignalLow } from 'lucide-react';
import type { Task, Status } from '@/hooks/useTasks';
import { apiFetch } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AssignMemberPopover from './AssignMemberPopover';
import { useTheme } from '@/context/theme-context';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1a1a' : '#ffffff';
  const tc = isDark ? '#e5e5e5' : '#171717';
  const muted = isDark ? '#888' : '#6b7280';
  const borderC = isDark ? 'rgba(55,55,55,1)' : 'rgba(229,229,229,1)';
  const hoverBg = isDark ? '#222' : '#f9fafb';
  const headBg = isDark ? '#1e1e1e' : '#f9fafb';
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

  async function handleDelete(taskId: string) {
    if (confirm('Confirm delete?')) {
      await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
      window.location.reload();
    }
  }

  async function handleDuplicate(task: Task) {
    await apiFetch(`/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        title: `${task.title} (copy)`,
        status: task.status,
        projectId: task.projectId,
        priority: task.priority,
        assignee: task.assignee,
      })
    });
    window.location.reload();
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Section header — outside the table card */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 px-1 py-2 mb-2 transition-colors text-left"
      >
        {isCollapsed
          ? <ChevronRight size={14} className="shrink-0" style={{ color: muted }} />
          : <ChevronDown size={14} className="shrink-0" style={{ color: muted }} />}
        <span className="text-sm font-medium" style={{ color: tc }}>{status}</span>
      </button>

      {!isCollapsed && (
        <div style={{ border: `1px solid ${borderC}`, background: bg, borderRadius: '6px', overflow: 'hidden', width: '100%' }}>
          <div className="overflow-x-auto overscroll-x-contain scrollbar-none">
            <table className="border-collapse" style={{ width: '100%' }}>
              <colgroup>
                <col />
                {fields.priority && <col style={{ width: '110px' }} />}
                {fields.members && <col style={{ width: '100px' }} />}
                {fields.dueDate && <col style={{ width: '130px' }} />}
                {fields.labels && <col style={{ width: '110px' }} />}
                {fields.status && <col style={{ width: '110px' }} />}
                {fields.reporter && <col style={{ width: '90px' }} />}
                <col style={{ width: '0' }} />
                <col style={{ width: '60px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: headBg }}>
                  <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Task</th>
                  {fields.priority && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Priority</th>}
                  {fields.members && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Members</th>}
                  {fields.dueDate && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Due Date</th>}
                  {fields.labels && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Labels</th>}
                  {fields.status && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Status</th>}
                  {fields.reporter && <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Reporter</th>}
                  <th style={{ borderBottom: `1px solid ${borderC}` }} />
                  <th className="text-left text-[12px] font-medium" style={{ color: muted, height: '48px', padding: '0 12px', borderBottom: `1px solid ${borderC}` }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="transition-colors cursor-pointer" style={{ borderBottom: `1px solid ${borderC}` }} onMouseEnter={e => (e.currentTarget.style.background = hoverBg)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} onClick={() => router.push(`/dashboard/tasks/${task._id}`)}>
                    <td className="text-[13px] font-medium" style={{ color: tc, padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>{task.title}</td>
                    {fields.priority && <td style={{ padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}><Priority value={task.priority} /></td>}
                    {fields.members && (
                      <td style={{ padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }} onClick={(e) => e.stopPropagation()}>
                        <AssignMemberPopover
                          taskId={task._id}
                          currentMembers={task.members || (task.assignee ? [task.assignee] : [])}
                          onMembersChange={() => window.location.reload()}
                          trigger={
                            task.assignee ? (
                              <button className="outline-none flex items-center justify-center"><Avatar name={task.assignee} /></button>
                            ) : (
                              <button className="w-7 h-7 rounded-full border border-dashed flex items-center justify-center transition-colors outline-none" style={{ borderColor: borderC, color: muted }}><Plus size={10} /></button>
                            )
                          }
                        />
                      </td>
                    )}
                    {fields.dueDate && (
                      <td className="text-[13px] whitespace-nowrap" style={{ color: tc, padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span style={{ color: muted }}>—</span>}
                      </td>
                    )}
                    {fields.labels && (
                      <td style={{ padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((t) => <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: isDark ? '#2a2a2a' : '#f0f0f0', color: tc }}>{t}</span>)}
                        </div>
                      </td>
                    )}
                    {fields.status && <td className="text-[13px]" style={{ color: tc, padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>{task.status}</td>}
                    {fields.reporter && <td className="text-[13px]" style={{ color: muted, padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>You</td>}
                    <td style={{ borderBottom: `1px solid ${borderC}` }} />
                    <td style={{ padding: '12px', height: '44px', borderBottom: `1px solid ${borderC}` }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="transition-colors outline-none p-1.5 flex items-center justify-center rounded ml-auto" style={{ color: muted }} onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/tasks/${task._id}`); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(task); }}>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(task._id); }} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ borderTop: `1px solid ${borderC}`, padding: '8px 12px' }}>
            {adding ? (
              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                onBlur={commitAdd}
                placeholder="Task name…"
                className="text-[13px] outline-none bg-transparent w-full"
                style={{ color: tc }}
              />
            ) : (
              <button onClick={startAdding} className="flex items-center gap-1.5 text-[13px] transition-colors" style={{ color: muted }}>
                <Plus size={13} />
                Add Task
              </button>
            )}
          </div>
        </div>
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
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 scrollbar-none" style={{ overflowX: 'hidden' }}>
      <div className="flex flex-col" style={{ gap: '16px' }}> 
      {STATUSES.filter((s) => !searching || tasksByColumn[s].length > 0).map((s) => (
        <StatusSection key={s} status={s} tasks={tasksByColumn[s]} onAddTask={onAddTask} searching={searching} fields={fields} />
      ))}
      </div>
    </div>
  );
}
