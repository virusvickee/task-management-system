'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lock, Eye, Share2, MoreHorizontal, PanelRight,
  ChevronDown, ChevronRight, Plus, Settings,
  CalendarDays, Paperclip, Send, BarChart2, Check, Calendar, Users,
  Smile, Link as LinkIcon,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { Task } from '@/hooks/useTasks';
import DatePickerPopover, { formatPillDate } from '@/components/DatePickerPopover';

const AVATAR_COLORS = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500'];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`w-${size} h-${size} rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>
      {initials}
    </span>
  );
}

type Priority = 'No Priority' | 'Urgent' | 'High' | 'Medium' | 'Low';
const PRIORITIES: { label: Priority; color: string }[] = [
  { label: 'No Priority', color: 'text-gray-400' },
  { label: 'Urgent',      color: 'text-red-600' },
  { label: 'High',        color: 'text-red-500' },
  { label: 'Medium',      color: 'text-orange-500' },
  { label: 'Low',         color: 'text-gray-400' },
];

const LABEL_COLORS: Record<string, string> = {
  'Research': 'bg-gray-400',
  'Design': 'bg-blue-400',
  'Development': 'bg-violet-500',
  'Testing': 'bg-teal-500',
  'Deployment': 'bg-emerald-500',
};

const DEMO_SUBTASKS = [
  { _id: '1', title: 'Subtask 1', priority: 'High' as Priority, priorityColor: 'text-red-500', assignee: 'Ankit Dutta', dueDate: '12 Sep 2026' },
  { _id: '2', title: 'Subtask 2', priority: 'Low' as Priority, priorityColor: 'text-gray-400', assignee: 'CN', dueDate: '15 Sep 2026' },
  { _id: '3', title: 'Subtask 3', priority: 'Medium' as Priority, priorityColor: 'text-orange-500', assignee: '', dueDate: '18 Sep 2026' },
];

function PriorityDropdown({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const current = PRIORITIES.find((p) => p.label === value) ?? PRIORITIES[0];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={`flex items-center gap-1 text-[13px] font-medium ${current.color} hover:opacity-80`}>
        <BarChart2 size={13} />
        <span>{value}</span>
        <ChevronDown size={13} className="text-gray-400 ml-0.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1">
          {PRIORITIES.map((p) => (
            <button
              key={p.label}
              onClick={() => { onChange(p.label); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] text-gray-700 font-medium transition-colors ${p.label === value ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
            >
              <span className={`flex items-center gap-2 ${p.color}`}><BarChart2 size={13} />{p.label}</span>
              {p.label === value && <Check size={12} className="text-gray-900" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SubtasksSection({ taskId }: { taskId: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/tasks/${taskId}`).then((t) => setSubtasks(t.subtasks || [])).catch(console.error).finally(() => setLoading(false));
  }, [taskId]);

  const displaySubtasks = subtasks.length > 0 ? subtasks : DEMO_SUBTASKS;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed((v) => !v)} className="w-full flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-left">
        {collapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        <span className="text-sm font-semibold text-gray-800">Subtasks</span>
      </button>
      {!collapsed && (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-t border-gray-100">
                <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-gray-500 w-[35%]">Task</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-gray-500">Priority</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-gray-500">Members</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-gray-500 whitespace-nowrap">Due Date</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displaySubtasks.map((s: any) => {
                const prio = PRIORITIES.find((p) => p.label === (s.priority || 'High'));
                return (
                  <tr key={s._id} className="border-t border-gray-100 hover:bg-gray-50 h-12">
                    <td className="px-4 py-2 text-[13px] text-gray-900 font-medium">{s.title}</td>
                    <td className="px-4 py-2">
                      <span className={`flex items-center gap-1 text-[13px] font-medium ${s.priorityColor || prio?.color || 'text-gray-400'}`}>
                        <BarChart2 size={13} />
                        {s.priority || 'High'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {s.assignee ? (
                        <Avatar name={s.assignee} size={7} />
                      ) : (
                        <button className="w-7 h-7 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors">
                          <Plus size={13} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-2 text-[13px] text-gray-700 whitespace-nowrap">{s.dueDate || '—'}</td>
                    <td className="px-4 py-2"><button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-2.5 border-t border-gray-100">
            <button className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-600 py-0.5 font-medium">
              <Plus size={14} />Add Subtasks
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CommentsSection({ taskId, assignee }: { taskId: string; assignee: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/tasks/${taskId}`).then((t) => setComments(t.comments || [])).catch(console.error).finally(() => setLoading(false));
  }, [taskId]);

  async function addComment(text: string) {
    if (!text.trim()) return;
    try {
      await apiFetch(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ comments: [...comments, { author: assignee, text, time: 'just now' }] }),
      });
      setComments((prev) => [...prev, { author: assignee, text, time: 'just now' }]);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Section heading */}
      <h3 className="text-sm font-semibold text-gray-800">Subtasks</h3>

      {/* Comment list */}
      <div className="flex flex-col gap-4">
        {comments.map((c, i) => (
          <div key={i} className="flex gap-3">
            <Avatar name={c.author} size={7} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[13px] font-semibold text-gray-900">{c.author}</span>
                <span className="text-[11px] text-gray-400">{c.time}</span>
                <div className="ml-auto flex items-center gap-1">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"><Smile size={14} /></button>
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors"><MoreHorizontal size={14} /></button>
                </div>
              </div>
              <p className="text-[13px] text-gray-700 leading-relaxed">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
        <Avatar name={assignee || 'Guest'} size={6} />
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { addComment(reply); setReply(''); } }}
          placeholder="Leave a reply..."
          className="flex-1 text-[13px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        <button onClick={() => { addComment(reply); setReply(''); }} className="text-gray-400 hover:text-gray-600 transition-colors"><Paperclip size={14} /></button>
        <button onClick={() => { addComment(reply); setReply(''); }} className="text-gray-400 hover:text-gray-600 transition-colors"><Send size={14} /></button>
      </div>

      {/* Add a comment */}
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { addComment(newComment); setNewComment(''); } }}
          placeholder="Add a comment..."
          className="flex-1 text-[13px] text-gray-800 placeholder-gray-400 outline-none bg-transparent"
        />
        <button onClick={() => { addComment(newComment); setNewComment(''); }} className="text-gray-400 hover:text-gray-600 transition-colors"><Paperclip size={14} /></button>
        <button onClick={() => { addComment(newComment); setNewComment(''); }} className="text-gray-400 hover:text-gray-600 transition-colors"><Send size={14} /></button>
      </div>
    </div>
  );
}

function DatesField({ task }: { task: Task }) {
  const [startDate, setStartDate] = useState<string | null>(task.startDate || null);
  const [endDate, setEndDate] = useState<string | null>(task.endDate || (task.dueDate ? task.dueDate : null));
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    if (task.startDate !== undefined) setStartDate(task.startDate || null);
    if (task.endDate !== undefined) setEndDate(task.endDate || null);
    else if (task.dueDate) setEndDate(task.dueDate || null);
  }, [task.startDate, task.endDate, task.dueDate]);

  const handleSelectDate = async (dateStr: string) => {
    let nextStart = startDate;
    let nextEnd = endDate;

    if (activePicker === 'start') {
      nextStart = dateStr;
      setStartDate(dateStr);
    } else if (activePicker === 'end') {
      nextEnd = dateStr;
      setEndDate(dateStr);
    }

    try {
      await apiFetch(`/tasks/${task._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ startDate: nextStart, endDate: nextEnd }),
      });
    } catch (e) {
      console.error('Failed to update dates:', e);
    }
  };

  const startFormatted = formatPillDate(startDate);
  const endFormatted = formatPillDate(endDate);

  return (
    <div className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setActivePicker((curr) => (curr === 'start' ? null : 'start'))}
        className="px-2.5 py-1 border border-gray-200 rounded-md text-[12px] font-normal flex items-center gap-1.5 transition-colors bg-white hover:bg-gray-50"
      >
        <Calendar size={12} className="text-gray-400 shrink-0" />
        <span className={startFormatted ? 'text-gray-700' : 'text-gray-400'}>{startFormatted || 'Jan 10'}</span>
      </button>

      <span className="text-gray-400 text-[11px] font-medium select-none">→</span>

      <button
        type="button"
        onClick={() => setActivePicker((curr) => (curr === 'end' ? null : 'end'))}
        className="px-2.5 py-1 border border-gray-200 rounded-md text-[12px] font-normal flex items-center gap-1.5 transition-colors bg-white hover:bg-gray-50"
      >
        <Calendar size={12} className="text-gray-400 shrink-0" />
        <span className={endFormatted ? 'text-gray-700' : 'text-gray-400'}>{endFormatted || 'End'}</span>
      </button>

      {activePicker && (
        <DatePickerPopover
          selectedDate={activePicker === 'start' ? startDate : endDate}
          onSelectDate={handleSelectDate}
          onClose={() => setActivePicker(null)}
        />
      )}
    </div>
  );
}

function RightPanel({ task, priority, onPriorityChange }: { task: Task; priority: Priority; onPriorityChange: (p: Priority) => void }) {
  const statusDot: Record<string, string> = {
    'Backlog': 'bg-amber-500', 'To Do': 'bg-amber-500', 'Doing': 'bg-blue-500', 'Completed': 'bg-green-500', 'On Hold': 'bg-orange-400',
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="border border-gray-200 rounded-xl overflow-visible bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
            <ChevronDown size={14} className="text-gray-500" />
            <span>Details</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <button className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"><Plus size={15} /></button>
            <button className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"><Settings size={15} /></button>
          </div>
        </div>
        <div className="px-4 py-3 flex flex-col gap-4">
          {[
            ['Status', <span key="s" className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${statusDot[task.status] ?? 'bg-amber-500'}`} /><span className="text-[13px] text-gray-900 font-medium">{task.status || 'Backlog'}</span></span>],
            ['Priority', <PriorityDropdown key="p" value={priority} onChange={onPriorityChange} />],
            ['Members', <span key="m" className="flex items-center gap-1.5 text-[13px] text-gray-900 font-medium"><Users size={14} className="text-gray-500" />{task.assignee || 'Add members'}</span>],
            ['Dates', <DatesField key="d" task={task} />],
            ['Labels', task.tags.length ? <div key="l" className="flex flex-wrap gap-1">{task.tags.map((t) => <span key={t} className="bg-gray-100 text-gray-600 text-[11px] font-medium px-2 py-0.5 rounded-full">{t}</span>)}</div> : <span key="l" className="text-[13px] text-gray-400">—</span>],
            ['Teams', <span key="t" className="text-[13px] text-gray-400">—</span>],
            ['Reporter', <span key="r" className="text-[13px] text-gray-700">You</span>],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-gray-500 shrink-0 min-w-[65px]">{label}</span>
              <div className="flex justify-end">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-gray-900 font-semibold text-sm">
          <ChevronDown size={14} className="text-gray-500" />
          <span>Updates</span>
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex items-start gap-2.5">
            <Avatar name="Ankit Dutta" size={7} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <BarChart2 size={14} className="text-red-500 shrink-0" />
                <span className="text-[13px] text-gray-700">changed priority to <span className="font-semibold text-red-500">{priority}</span></span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">posted an update · Aug 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [priority, setPriority] = useState<Priority>('No Priority');

  async function handlePriorityChange(p: Priority) {
    setPriority(p);
    try {
      await apiFetch(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: p }),
      });
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  }
  const [rightPanel, setRightPanel] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/tasks/${id}`)
      .then((t) => {
        setTask(t);
        setPriority((t.priority as Priority) || 'No Priority');
      })
      .catch(() => router.replace('/dashboard'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!task) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Task not found</div>;

  const labels = task.tags.length ? task.tags : ['Research', 'Design', 'Development', 'Testing', 'Deployment'];

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* Top header bar */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{task.title}</h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Lock size={14} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1">
            <Eye size={14} /><span className="text-[11px]">1</span>
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Share2 size={14} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <MoreHorizontal size={14} />
          </button>
          <button
            onClick={() => setRightPanel((v) => !v)}
            className={`p-1.5 border rounded-lg transition-colors ${rightPanel ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <PanelRight size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-white dark:bg-gray-950">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
          {/* Properties row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
            <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Properties</span>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1">
              <Avatar name={task.assignee || 'Designer'} size={5} />
              <span className="text-[12px] text-gray-700 dark:text-gray-300 font-medium">{task.assignee || 'Designer'}</span>
            </div>
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950 text-orange-500 text-[12px] font-medium px-2.5 py-1 rounded-full border border-orange-100 dark:border-orange-900">
              <CalendarDays size={12} />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '31 Jul'}
            </div>
          </div>

          {/* Labels row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
            <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Labels</span>
            <div className="flex flex-wrap gap-2">
              {labels.map((t) => (
                <span key={t} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-[12px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${LABEL_COLORS[t] || 'bg-gray-400'}`} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Resources row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
            <span className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">Resources</span>
            <button className="text-[13px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5 transition-colors">
              <LinkIcon size={13} />Add document or link…
            </button>
          </div>

          {/* Subtasks table section */}
          <div className="mb-6">
            <SubtasksSection taskId={id} />
          </div>

          {/* Comments section */}
          <CommentsSection taskId={id} assignee={task.assignee || 'Ankit Dutta'} />
        </div>

        {/* Right panel */}
        {rightPanel && (
          <div className="w-full lg:w-72 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto overflow-x-visible p-4 bg-white dark:bg-gray-900">
            <RightPanel task={task} priority={priority} onPriorityChange={handlePriorityChange} />
          </div>
        )}
      </div>
    </div>
  );
}
