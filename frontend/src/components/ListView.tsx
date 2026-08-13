'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, MoreHorizontal, Plus, SignalLow } from 'lucide-react';
import type { Task, Status } from '@/hooks/useTasks';
import { getStoredUserName } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AssignMemberPopover from './AssignMemberPopover';
import { toastConfirm, toastSuccess } from '@/lib/toast';

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
  status, tasks, onAddTask, searching, fields, onDeleteTask, onDuplicateTask, onMembersChange,
}: {
  status: Status;
  tasks: Task[];
  onAddTask: (title: string, status: Status) => void;
  searching: boolean;
  fields: Record<string, boolean>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDuplicateTask: (task: Task) => Promise<void>;
  onMembersChange: () => void;
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

  function handleDelete(taskId: string) {
    toastConfirm({
      title: 'Delete task?',
      message: 'This task will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await onDeleteTask(taskId);
        toastSuccess('Task deleted');
      },
    });
  }

  async function handleDuplicate(task: Task) {
    await onDuplicateTask(task);
  }

  const currentUserName = getStoredUserName();

  return (
    <div style={{ width: '100%' }}>
      {/* Section header — outside the table card */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center gap-2 px-1 py-2 mb-2 transition-colors text-left"
      >
        {isCollapsed
          ? <ChevronRight size={14} className="shrink-0 list-view-section-icon" />
          : <ChevronDown size={14} className="shrink-0 list-view-section-icon" />}
        <span className="text-sm font-medium list-view-section-title">{status}</span>
      </button>

      {!isCollapsed && (
        <div className="list-view-table-wrap w-full">
          <div className="overflow-x-auto overscroll-x-contain scrollbar-none">
            <table className="border-collapse w-full">
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
                <tr className="list-view-table-head">
                  <th className="text-left text-[12px] font-medium h-12 px-3">Task</th>
                  {fields.priority && <th className="text-left text-[12px] font-medium h-12 px-3">Priority</th>}
                  {fields.members && <th className="text-left text-[12px] font-medium h-12 px-3">Members</th>}
                  {fields.dueDate && <th className="text-left text-[12px] font-medium h-12 px-3">Due Date</th>}
                  {fields.labels && <th className="text-left text-[12px] font-medium h-12 px-3">Labels</th>}
                  {fields.status && <th className="text-left text-[12px] font-medium h-12 px-3">Status</th>}
                  {fields.reporter && <th className="text-left text-[12px] font-medium h-12 px-3">Reporter</th>}
                  <th />
                  <th className="text-left text-[12px] font-medium h-12 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const taskHref = `/dashboard/tasks/${task._id}`;
                  return (
                  <tr
                    key={task._id}
                    className="list-view-table-row transition-colors cursor-pointer"
                    onMouseEnter={() => router.prefetch(taskHref)}
                    onClick={() => router.push(taskHref)}
                  >
                    <td className="text-[13px] font-medium p-3 h-11">{task.title}</td>
                    {fields.priority && <td className="p-3 h-11"><Priority value={task.priority} /></td>}
                    {fields.members && (
                      <td className="p-3 h-11" onClick={(e) => e.stopPropagation()}>
                        <AssignMemberPopover
                          taskId={task._id}
                          currentMembers={task.members || (task.assignee ? [task.assignee] : [])}
                          onMembersChange={onMembersChange}
                          trigger={
                            task.assignee ? (
                              <button className="outline-none flex items-center justify-center"><Avatar name={task.assignee} /></button>
                            ) : (
                              <button className="w-7 h-7 rounded-full border border-dashed border-[color:var(--base-border)] list-view-table-cell-muted flex items-center justify-center transition-colors outline-none"><Plus size={10} /></button>
                            )
                          }
                        />
                      </td>
                    )}
                    {fields.dueDate && (
                      <td className="text-[13px] whitespace-nowrap p-3 h-11">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="list-view-table-cell-muted">—</span>}
                      </td>
                    )}
                    {fields.labels && (
                      <td className="p-3 h-11">
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((t) => <span key={t} className="list-view-tag text-[11px] font-medium px-2 py-0.5 rounded-full">{t}</span>)}
                        </div>
                      </td>
                    )}
                    {fields.status && <td className="text-[13px] p-3 h-11">{task.status}</td>}
                    {fields.reporter && (
                      <td className="text-[13px] list-view-table-cell-muted p-3 h-11">
                        {task.reporterName || currentUserName}
                      </td>
                    )}
                    <td />
                    <td className="p-3 h-11">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="list-view-table-cell-muted transition-colors outline-none p-1.5 flex items-center justify-center rounded ml-auto" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(taskHref); }}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(task); }}>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(task._id); }} className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[color:var(--base-border)] px-3 py-2">
            {adding ? (
              <input
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                onBlur={commitAdd}
                placeholder="Task name…"
                className="text-[13px] outline-none bg-transparent w-full text-[var(--base-primary)]"
              />
            ) : (
              <button onClick={startAdding} className="flex items-center gap-1.5 text-[13px] transition-colors list-view-table-cell-muted">
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
  compact = false,
  onDeleteTask,
  onDuplicateTask,
  onMembersChange,
}: {
  tasksByColumn: Record<Status, Task[]>;
  onAddTask: (title: string, status: Status) => void;
  query: string;
  fields: Record<string, boolean>;
  compact?: boolean;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDuplicateTask: (task: Task) => Promise<void>;
  onMembersChange: () => void;
}) {
  const STATUSES: Status[] = ['To Do', 'Doing', 'Completed', 'On Hold'];
  const searching = query.length > 0;
  return (
    <div className={`flex-1 overflow-y-auto scrollbar-none ${compact ? 'p-0' : 'p-3 sm:p-6'}`} style={{ overflowX: 'hidden' }}>
      <div className="flex flex-col" style={{ gap: '16px' }}> 
      {STATUSES.filter((s) => !searching || tasksByColumn[s].length > 0).map((s) => (
        <StatusSection
          key={s}
          status={s}
          tasks={tasksByColumn[s]}
          onAddTask={onAddTask}
          searching={searching}
          fields={fields}
          onDeleteTask={onDeleteTask}
          onDuplicateTask={onDuplicateTask}
          onMembersChange={onMembersChange}
        />
      ))}
      </div>
    </div>
  );
}
