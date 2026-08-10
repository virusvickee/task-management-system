'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BarChart2, Calendar, CalendarDays, Check, ChevronDown, ChevronRight, Eye,
  Link as LinkIcon, Lock, MoreHorizontal, PanelLeftClose, PanelLeftOpen,
  PanelRight, Paperclip, Plus, Send, Settings, Share2, Smile, SmilePlus, Tag, Users, X,
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';
import { apiFetch } from '@/lib/api';
import type { Task } from '@/hooks/useTasks';
import DatePickerPopover, { formatFullDate, formatPillDate } from '@/components/DatePickerPopover';
import AssignMemberPopover from '@/components/AssignMemberPopover';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LABELS = ['Design', 'Frontend', 'Backend', 'DevOps', 'Docs', 'Auth', 'Bug', 'Research'];
const TEAMS = ['Design', 'Engineering', 'Product', 'QA'];
const DETAIL_FIELDS = ['Status', 'Priority', 'Members', 'Dates', 'Labels', 'Teams', 'Reporter'] as const;
type DetailField = (typeof DETAIL_FIELDS)[number];
type Priority = 'No Priority' | 'Urgent' | 'High' | 'Medium' | 'Low';

const PRIORITIES: { label: Priority; color: string }[] = [
  { label: 'No Priority', color: 'text-gray-400' },
  { label: 'Urgent', color: 'text-red-600' },
  { label: 'High', color: 'text-red-500' },
  { label: 'Medium', color: 'text-orange-500' },
  { label: 'Low', color: 'text-gray-400' },
];
const AVATAR_COLORS = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500'];

function avatarColor(name: string) {
  return AVATAR_COLORS[[...name].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <span className={`w-${size} h-${size} rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>{initials}</span>;
}

function LabelEditor({ tags, onUpdate, disabled = false }: { tags: string[]; onUpdate: (tags: string[]) => Promise<unknown>; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const toggle = async (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
    try { await onUpdate(next); } catch { /* parent restores optimistic state */ }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`flex flex-wrap justify-end gap-1 ${disabled ? 'opacity-45' : ''}`}>
        {tags.map((tag) => (
          <span key={tag} onClick={() => !disabled && setOpen(true)} className="cursor-pointer bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
            <Tag size={11} className="text-gray-500 dark:text-gray-400" />{tag}
            {!disabled && <button aria-label={`Remove ${tag} label`} onClick={(event) => { event.stopPropagation(); toggle(tag); }} className="-mr-0.5 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] rounded"><X size={11} /></button>}
          </span>
        ))}
        {!disabled && <PopoverTrigger asChild><button aria-label="Add label" className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] flex items-center justify-center"><Plus size={12} /></button></PopoverTrigger>}
      </div>
      <PopoverContent align="end" className="w-44 p-1">
        {LABELS.map((tag) => <button key={tag} onClick={() => toggle(tag)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800">
          <Tag size={13} className="text-gray-400" /><span className="flex-1">{tag}</span>{tags.includes(tag) && <Check size={14} />}
        </button>)}
      </PopoverContent>
    </Popover>
  );
}

function TeamPicker({ team, onUpdate, disabled = false }: { team?: string; onUpdate: (team: string) => Promise<unknown>; disabled?: boolean }) {
  return <Popover><PopoverTrigger asChild><button disabled={disabled} className={`text-[13px] ${team ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}>{team || '—'}</button></PopoverTrigger><PopoverContent align="end" className="w-40 p-1">
    {TEAMS.map((option) => <button key={option} onClick={() => onUpdate(option)} className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"><span>{option}</span>{team === option && <Check size={14} />}</button>)}
  </PopoverContent></Popover>;
}

function PriorityDropdown({ value, onChange, disabled = false }: { value: Priority; onChange: (value: Priority) => Promise<unknown>; disabled?: boolean }) {
  const current = PRIORITIES.find((item) => item.label === value) || PRIORITIES[0];
  return <DropdownMenu><DropdownMenuTrigger asChild><button disabled={disabled} className={`flex items-center gap-1 text-[13px] font-medium ${current.color} ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:opacity-80'}`}><BarChart2 size={13} /><span>{value}</span><ChevronDown size={13} className="text-gray-400" /></button></DropdownMenuTrigger><DropdownMenuContent align="end">
    {PRIORITIES.map((option) => <DropdownMenuItem key={option.label} onClick={() => onChange(option.label)}><BarChart2 size={13} className={option.color} /><span className="ml-2">{option.label}</span>{option.label === value && <Check size={12} className="ml-auto" />}</DropdownMenuItem>)}
  </DropdownMenuContent></DropdownMenu>;
}

function DatesField({ task, onUpdate, disabled = false }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown>; disabled?: boolean }) {
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const startDate = task.startDate || null;
  const endDate = task.endDate || task.dueDate || null;
  const startBtnRef = useRef<HTMLButtonElement>(null);
  const endBtnRef = useRef<HTMLButtonElement>(null);
  const selectDate = async (date: string) => {
    if (!activePicker) return;
    await onUpdate(activePicker === 'start' ? { startDate: date } : { endDate: date, dueDate: date });
    setActivePicker(null);
  };
  return (
    <div className="relative flex flex-wrap items-center gap-1">
      <button ref={startBtnRef} disabled={disabled} onClick={() => setActivePicker('start')} className={`px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-[12px] flex items-center gap-1 bg-white dark:bg-gray-800 ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Calendar size={12} className="text-gray-400" /><span className={startDate ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>{formatPillDate(startDate) || 'Start'}</span></button>
      <span className="text-gray-400">→</span>
      <button ref={endBtnRef} disabled={disabled} onClick={() => setActivePicker('end')} className={`px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-[12px] flex items-center gap-1 bg-white dark:bg-gray-800 ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Calendar size={12} className="text-gray-400" /><span className={endDate ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>{formatPillDate(endDate) || 'End'}</span></button>
      {activePicker && <DatePickerPopover anchorRef={activePicker === 'start' ? startBtnRef : endBtnRef} selectedDate={activePicker === 'start' ? startDate : endDate} onSelectDate={selectDate} onClose={() => setActivePicker(null)} />}
    </div>
  );
}

function LegacySubtasksSection({ task, locked }: { task: Task; locked: boolean }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>((task as Task & { subtasks?: Task[] }).subtasks || []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  useEffect(() => setSubtasks((task as Task & { subtasks?: Task[] }).subtasks || []), [task]);
  const updateSubtask = async (subtaskId: string, partial: Partial<Task>) => {
    const previous = subtasks;
    setSubtasks((items) => items.map((item) => item._id === subtaskId ? { ...item, ...partial } : item));
    try { const saved = await apiFetch(`/tasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(partial) }); setSubtasks((items) => items.map((item) => item._id === subtaskId ? saved : item)); return saved; } catch (error) { setSubtasks(previous); throw error; }
  };
  const addSubtask = async () => {
    const trimmed = title.trim();
    if (!trimmed) { setAdding(false); return; }
    const temporary: Task = { _id: `tmp-${Date.now()}`, title: trimmed, status: 'To Do', tags: [], parentTaskId: task._id, projectId: task.projectId };
    setSubtasks((items) => [...items, temporary]); setTitle(''); setAdding(false);
    try { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: trimmed, status: 'To Do', projectId: task.projectId, parentTaskId: task._id }) }); setSubtasks((items) => items.map((item) => item._id === temporary._id ? saved : item)); } catch { setSubtasks((items) => items.filter((item) => item._id !== temporary._id)); }
  };
  const duplicate = async (subtask: Task) => { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${subtask.title} (copy)`, status: subtask.status, projectId: subtask.projectId, parentTaskId: task._id, priority: subtask.priority, members: subtask.members, tags: subtask.tags }) }); setSubtasks((items) => [...items, saved]); };
  const remove = async (subtask: Task) => { if (!window.confirm('Delete this subtask?')) return; const previous = subtasks; setSubtasks((items) => items.filter((item) => item._id !== subtask._id)); try { await apiFetch(`/tasks/${subtask._id}`, { method: 'DELETE' }); } catch { setSubtasks(previous); } };
  return <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"><button onClick={() => setCollapsed((value) => !value)} className="w-full flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-left">{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<span className="text-sm font-semibold">Subtasks</span></button>{!collapsed && <><div className="overflow-x-auto overscroll-x-contain"><table className="w-full border-collapse" style={{ minWidth: '480px' }}><thead><tr className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800"><th className="text-left px-4 py-2 text-[12px] text-gray-500">Task</th><th className="text-left px-4 py-2 text-[12px] text-gray-500">Priority</th><th className="text-left px-4 py-2 text-[12px] text-gray-500">Members</th><th className="text-left px-4 py-2 text-[12px] text-gray-500">Due Date</th><th className="text-right px-4 py-2 text-[12px] text-gray-500">Actions</th></tr></thead><tbody>{subtasks.map((subtask) => { const priority = PRIORITIES.find((item) => item.label === subtask.priority) || PRIORITIES[0]; const member = subtask.members?.[0] || subtask.assignee; return <tr key={subtask._id} className="border-t border-gray-100 dark:border-gray-800 h-12"><td className="px-4 py-2 text-[13px] font-medium">{subtask.title}</td><td className={`px-4 py-2 text-[13px] ${priority.color}`}><span className="flex gap-1 items-center"><BarChart2 size={13} />{priority.label}</span></td><td className="px-4 py-2"><AssignMemberPopover taskId={subtask._id} currentMembers={subtask.members || (subtask.assignee ? [subtask.assignee] : [])} onUpdate={(members) => updateSubtask(subtask._id, { members, assignee: members[0] || '' })} trigger={member ? <button className="min-w-[40px] min-h-[40px] flex items-center justify-center"><Avatar name={member} size={7} /></button> : <button className="w-7 h-7 rounded-full border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400"><Plus size={13} /></button>} /></td><td className="px-4 py-2 text-[13px] text-gray-600 dark:text-gray-300">{formatPillDate(subtask.dueDate || subtask.endDate || null) || '—'}</td><td className="px-4 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><button className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"><MoreHorizontal size={16} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${subtask._id}`)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(subtask)}>Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => remove(subtask)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>; })}</tbody></table></div><div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">{adding ? <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={addSubtask} onKeyDown={(event) => { if (event.key === 'Enter') addSubtask(); if (event.key === 'Escape') { setAdding(false); setTitle(''); } }} placeholder="Subtask title" className="w-full text-[13px] bg-transparent outline-none" /> : <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 min-h-[40px]"><Plus size={14} />Add Subtasks</button>}</div></>}</div>;
}

function SubtaskDueDate({ task, onUpdate, disabled = false, open, onOpenChange }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown>; disabled?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const date = task.dueDate || task.endDate || null;
  const isOpen = open ?? internalOpen;
  const btnRef = useRef<HTMLButtonElement>(null);
  const toggleOpen = (value: boolean) => { if (open === undefined) setInternalOpen(value); onOpenChange?.(value); };
  return <div className="relative"><button ref={btnRef} data-subtask-date={task._id} disabled={disabled} onClick={() => toggleOpen(!isOpen)} className={`rounded px-1 py-1 text-[13px] text-gray-600 dark:text-gray-300 ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{formatFullDate(date) || 'Add date'}</button>{isOpen && <DatePickerPopover anchorRef={btnRef} selectedDate={date} onSelectDate={async (value) => { await onUpdate({ dueDate: value, endDate: value }); toggleOpen(false); }} onClose={() => toggleOpen(false)} />}</div>;
}

function LegacySubtasksSection2({ task, locked }: { task: Task; locked: boolean }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>((task as Task & { subtasks?: Task[] }).subtasks || []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  useEffect(() => setSubtasks((task as Task & { subtasks?: Task[] }).subtasks || []), [task]);
  const updateSubtask = async (subtaskId: string, partial: Partial<Task>) => {
    const previous = subtasks;
    setSubtasks((items) => items.map((item) => item._id === subtaskId ? { ...item, ...partial } : item));
    try { const saved = await apiFetch(`/tasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(partial) }); setSubtasks((items) => items.map((item) => item._id === subtaskId ? saved : item)); return saved; } catch (error) { setSubtasks(previous); throw error; }
  };
  const addSubtask = async () => { const trimmed = title.trim(); if (!trimmed) { setAdding(false); return; } const temporary: Task = { _id: `tmp-${Date.now()}`, title: trimmed, status: 'To Do', tags: [], parentTaskId: task._id, projectId: task.projectId }; setSubtasks((items) => [...items, temporary]); setTitle(''); setAdding(false); try { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: trimmed, status: 'To Do', projectId: task.projectId, parentTaskId: task._id }) }); setSubtasks((items) => items.map((item) => item._id === temporary._id ? saved : item)); } catch { setSubtasks((items) => items.filter((item) => item._id !== temporary._id)); } };
  const duplicate = async (subtask: Task) => { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${subtask.title} (copy)`, status: subtask.status, projectId: subtask.projectId, parentTaskId: task._id, priority: subtask.priority, members: subtask.members, tags: subtask.tags }) }); setSubtasks((items) => [...items, saved]); };
  const remove = async (subtask: Task) => { if (!window.confirm('Delete this subtask?')) return; const previous = subtasks; setSubtasks((items) => items.filter((item) => item._id !== subtask._id)); try { await apiFetch(`/tasks/${subtask._id}`, { method: 'DELETE' }); } catch { setSubtasks(previous); } };
  return <div className="overflow-visible"><button onClick={() => setCollapsed((value) => !value)} className="flex h-8 items-center gap-2 pb-3 text-left text-sm font-semibold">{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<span>Subtasks</span></button>{!collapsed && <><div className="overflow-x-auto overscroll-x-contain"><table className="w-full border-collapse" style={{ minWidth: '480px' }}><thead><tr className="bg-gray-50 dark:bg-gray-800/60"><th className="px-4 py-2 text-left text-[12px] text-gray-500">Task</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Priority</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Members</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Due Date</th><th className="px-4 py-2 text-right text-[12px] text-gray-500">Actions</th></tr></thead><tbody>{subtasks.map((subtask) => { const member = subtask.members?.[0] || subtask.assignee; return <tr key={subtask._id} className="h-12 border-t border-gray-100 dark:border-gray-800"><td className="px-4 py-2 text-[13px] font-medium">{subtask.title}</td><td className="px-4 py-2"><PriorityDropdown value={(subtask.priority as Priority) || 'No Priority'} onChange={(priority) => updateSubtask(subtask._id, { priority })} disabled={locked} /></td><td className="px-4 py-2"><AssignMemberPopover taskId={subtask._id} currentMembers={subtask.members || (subtask.assignee ? [subtask.assignee] : [])} onUpdate={(members) => updateSubtask(subtask._id, { members, assignee: members[0] || '' })} disabled={locked} trigger={member ? <button className="min-w-[40px] min-h-[40px] flex items-center justify-center"><Avatar name={member} size={7} /></button> : <button className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400"><Plus size={13} /></button>} /></td><td className="px-4 py-2"><SubtaskDueDate task={subtask} onUpdate={(partial) => updateSubtask(subtask._id, partial)} disabled={locked} /></td><td className="px-4 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"><MoreHorizontal size={16} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${subtask._id}`)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(subtask)}>Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => remove(subtask)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>; })}</tbody></table></div><div className="flex min-h-10 items-center border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">{adding ? <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={addSubtask} onKeyDown={(event) => { if (event.key === 'Enter') addSubtask(); if (event.key === 'Escape') { setAdding(false); setTitle(''); } }} placeholder="Subtask title" className="w-full bg-transparent text-[13px] outline-none" /> : <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 min-h-[40px]"><Plus size={14} />Add Subtasks</button>}</div></>}</div>;
}

function SubtasksSection({ task, locked }: { task: Task; locked: boolean }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>((task as Task & { subtasks?: Task[] }).subtasks || []);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  useEffect(() => setSubtasks((task as Task & { subtasks?: Task[] }).subtasks || []), [task]);
  const updateSubtask = async (subtaskId: string, partial: Partial<Task>) => { const previous = subtasks; setSubtasks((items) => items.map((item) => item._id === subtaskId ? { ...item, ...partial } : item)); try { const saved = await apiFetch(`/tasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(partial) }); setSubtasks((items) => items.map((item) => item._id === subtaskId ? saved : item)); return saved; } catch (error) { setSubtasks(previous); throw error; } };
  const addSubtask = async () => { const trimmed = title.trim(); if (!trimmed) { setAdding(false); return; } const temporary: Task = { _id: `tmp-${Date.now()}`, title: trimmed, status: 'To Do', tags: [], parentTaskId: task._id, projectId: task.projectId }; setSubtasks((items) => [...items, temporary]); setTitle(''); setAdding(false); try { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: trimmed, status: 'To Do', projectId: task.projectId, parentTaskId: task._id }) }); setSubtasks((items) => items.map((item) => item._id === temporary._id ? saved : item)); } catch { setSubtasks((items) => items.filter((item) => item._id !== temporary._id)); } };
  const duplicate = async (subtask: Task) => { const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${subtask.title} (copy)`, status: subtask.status, projectId: subtask.projectId, parentTaskId: task._id, priority: subtask.priority, members: subtask.members, tags: subtask.tags }) }); setSubtasks((items) => [...items, saved]); };
  const remove = async (subtask: Task) => { if (!window.confirm('Delete this subtask?')) return; const previous = subtasks; setSubtasks((items) => items.filter((item) => item._id !== subtask._id)); try { await apiFetch(`/tasks/${subtask._id}`, { method: 'DELETE' }); } catch { setSubtasks(previous); } };
  const changeStatus = (subtask: Task) => { const statuses = ['To Do', 'Doing', 'On Hold', 'Completed']; const next = statuses[(statuses.indexOf(subtask.status) + 1) % statuses.length]; return updateSubtask(subtask._id, { status: next }); };
  const changePriority = (subtask: Task) => { const index = PRIORITIES.findIndex((item) => item.label === subtask.priority); return updateSubtask(subtask._id, { priority: PRIORITIES[(index + 1) % PRIORITIES.length].label }); };
  const setDueDate = (subtask: Task) => {
    window.setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-subtask-date="${subtask._id}"]`)?.click(), 0);
  };
  const moveParent = async (subtask: Task) => { const parentTaskId = window.prompt('Enter the new parent task ID', task._id); if (parentTaskId?.trim() && parentTaskId.trim() !== task._id) { await updateSubtask(subtask._id, { parentTaskId: parentTaskId.trim() }); setSubtasks((items) => items.filter((item) => item._id !== subtask._id)); } };
  return <div className="overflow-visible"><button onClick={() => setCollapsed((value) => !value)} className="flex h-8 items-center gap-2 pb-3 text-left text-sm font-semibold">{collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}<span>Subtasks</span></button>{!collapsed && <><div className="overflow-x-auto overscroll-x-contain"><table className="w-full border-collapse" style={{ minWidth: '480px' }}><thead><tr className="bg-gray-50 dark:bg-gray-800/60"><th className="px-4 py-2 text-left text-[12px] text-gray-500">Task</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Priority</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Members</th><th className="px-4 py-2 text-left text-[12px] text-gray-500">Due Date</th><th className="px-4 py-2 text-right text-[12px] text-gray-500">Actions</th></tr></thead><tbody>{subtasks.map((subtask) => { const member = subtask.members?.[0] || subtask.assignee; return <tr key={subtask._id} className="h-12 border-t border-gray-100 dark:border-gray-800"><td className="px-4 py-2 text-[13px] font-medium">{subtask.title}</td><td className="px-4 py-2"><PriorityDropdown value={(subtask.priority as Priority) || 'No Priority'} onChange={(priority) => updateSubtask(subtask._id, { priority })} disabled={locked} /></td><td className="px-4 py-2"><AssignMemberPopover taskId={subtask._id} currentMembers={subtask.members || (subtask.assignee ? [subtask.assignee] : [])} onUpdate={(members) => updateSubtask(subtask._id, { members, assignee: members[0] || '' })} disabled={locked} trigger={member ? <button className="min-w-[40px] min-h-[40px] flex items-center justify-center"><Avatar name={member} size={7} /></button> : <button className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400"><Plus size={13} /></button>} /></td><td className="px-4 py-2"><SubtaskDueDate task={subtask} onUpdate={(partial) => updateSubtask(subtask._id, partial)} disabled={locked} /></td><td className="px-4 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"><MoreHorizontal size={16} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${subtask._id}`)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(subtask)}>Duplicate</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => updateSubtask(subtask._id, { status: 'Completed' })}>Mark complete</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => changeStatus(subtask)}>Change status</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => changePriority(subtask)}>Set priority</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => setDueDate(subtask)}>Set due date</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => moveParent(subtask)}>Move to another parent task</DropdownMenuItem><DropdownMenuItem onClick={() => remove(subtask)} className="text-red-600 focus:text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>; })}</tbody></table></div><div className="flex min-h-10 items-center border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">{adding ? <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} onBlur={addSubtask} onKeyDown={(event) => { if (event.key === 'Enter') addSubtask(); if (event.key === 'Escape') { setAdding(false); setTitle(''); } }} placeholder="Subtask title" className="w-full bg-transparent text-[13px] outline-none" /> : <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 min-h-[40px]"><Plus size={14} />Add Subtasks</button>}</div></>}</div>;
}

function formatRelativeTime(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

function LegacyCommentsSection({ taskId, author }: { taskId: string; author: string }) {
  const [comments, setComments] = useState<NonNullable<Task['comments']>>([]);
  const [reply, setReply] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const replyFileInput = useRef<HTMLInputElement>(null);
  const commentFileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { apiFetch(`/tasks/${taskId}`).then((item) => setComments(item.comments || [])).catch(console.error); }, [taskId]);
  const readAttachment = (file: File) => new Promise<{ name: string; dataUrl: string; type: string }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result), type: file.type || 'application/octet-stream' });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const submit = async (value: string, files: File[], clear: () => void, restore: (value: string) => void, restoreFiles: (files: File[]) => void) => {
    const text = value.trim() || (files.length ? `Attached ${files.map((file) => file.name).join(', ')}` : '');
    if (!text) return;
    const currentUser = typeof window === 'undefined' ? null : JSON.parse(localStorage.getItem('tms-user') || 'null');
    const previous = comments;
    const temporary = { author: currentUser?.name || author, text, createdAt: new Date().toISOString(), attachments: files.map((file) => ({ name: file.name, dataUrl: '', type: file.type })) };
    setComments((items) => [...items, temporary]);
    clear();
    try {
      const attachments = await Promise.all(files.map(readAttachment));
      const saved = await apiFetch(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text, attachments }) });
      setComments(saved.comments || previous);
    } catch {
      setComments(previous);
      restore(value);
      restoreFiles(files);
    }
  };
  const addReaction = async (comment: NonNullable<Task['comments']>[number], emoji: string) => {
    if (!comment._id) return;
    const previous = comments;
    setComments((items) => items.map((item) => item._id === comment._id ? { ...item, reactions: Array.from(new Set([...(item.reactions || []), emoji])) } : item));
    try {
      const saved = await apiFetch(`/tasks/${taskId}/comments/${comment._id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) });
      setComments(saved.comments || previous);
    } catch {
      setComments(previous);
    }
  };
  const replyInput = <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-4 py-3"><Avatar name={author} size={6} /><input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); }, setReply, setReplyFiles); }} placeholder="Leave a reply..." className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none placeholder:text-gray-400" /><input ref={replyFileInput} onChange={(event) => setReplyFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => replyFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); }, setReply, setReplyFiles)} aria-label="Send reply" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"><Send size={17} /></button>{replyFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div>;
  return <section className="mt-6 space-y-6">{comments.map((comment, index) => <div key={comment._id || `${comment.createdAt}-${index}`} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"><div className="px-4 py-4"><div className="flex items-center gap-2"><Avatar name={comment.author} size={7} /><span className="text-[13px] font-semibold">{comment.author}</span><span className="text-[13px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span><div className="ml-auto flex items-center gap-2 text-gray-800 dark:text-gray-200"><Popover><PopoverTrigger asChild><button title="Add reaction" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><Smile size={17} /></button></PopoverTrigger><PopoverContent className="w-auto p-1"><div className="flex gap-1">{['👍', '🎉', '❤️', '😂'].map((emoji) => <button key={emoji} onClick={() => addReaction(comment, emoji)} className="rounded p-1 text-base hover:bg-gray-100 dark:hover:bg-gray-800">{emoji}</button>)}</div></PopoverContent></Popover><DropdownMenu><DropdownMenuTrigger asChild><button title="More actions" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigator.clipboard.writeText(comment.text)}>Copy comment</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div><p className="mt-3 text-[15px] text-gray-800 dark:text-gray-200">{comment.text}</p>{comment.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{comment.attachments.map((attachment) => <a key={attachment.name} href={attachment.dataUrl} download={attachment.name} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><Paperclip size={12} />{attachment.name}</a>)}</div> : null}{comment.reactions?.length ? <div className="mt-3 flex gap-1">{comment.reactions.map((emoji) => <span key={emoji} className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] dark:bg-gray-800">{emoji}</span>)}</div> : null}</div>{replyInput}</div>)}<div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white px-4 py-4 dark:bg-gray-900 focus-within:border-gray-400 dark:focus-within:border-gray-500"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); }, setNewComment, setNewCommentFiles); }} placeholder="Add a comment..." className="flex-1 min-w-[120px] bg-transparent text-[15px] outline-none placeholder:text-gray-400" /><input ref={commentFileInput} onChange={(event) => setNewCommentFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => commentFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); }, setNewComment, setNewCommentFiles)} aria-label="Send comment" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"><Send size={17} /></button>{newCommentFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div></section>;
}

type Comment = NonNullable<Task['comments']>[number];

function CommentCard({
  comment,
  replyInput,
  onReaction,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  replyInput: React.ReactNode;
  onReaction: (comment: Comment, emoji: string) => void;
  onEdit: (comment: Comment, text: string) => void;
  onDelete: (comment: Comment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const save = () => {
    if (!text.trim() || text.trim() === comment.text) { setEditing(false); return; }
    onEdit(comment, text.trim());
    setEditing(false);
  };

  return <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"><div className="px-4 py-4"><div className="flex items-center gap-2"><Avatar name={comment.author} size={7} /><span className="text-[13px] font-semibold">{comment.author}</span><span className="text-[13px] text-gray-400">{formatRelativeTime(comment.createdAt)}</span><div className="ml-auto flex items-center gap-2 text-gray-800 dark:text-gray-200"><Popover><PopoverTrigger asChild><button title="Add reaction" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><SmilePlus size={18} /></button></PopoverTrigger><PopoverContent className="w-auto p-1"><div className="flex gap-1">{['👍', '🎉', '❤️', '😂'].map((emoji) => <button key={emoji} onClick={() => onReaction(comment, emoji)} className="rounded p-1 text-base hover:bg-gray-100 dark:hover:bg-gray-800">{emoji}</button>)}</div></PopoverContent></Popover><DropdownMenu><DropdownMenuTrigger asChild><button title="More actions" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigator.clipboard.writeText(comment.text)}>Copy comment</DropdownMenuItem>{comment._id && <DropdownMenuItem onClick={() => { setText(comment.text); setEditing(true); }}>Edit comment</DropdownMenuItem>}{comment._id && <DropdownMenuItem onClick={() => onDelete(comment)} className="text-red-600 focus:text-red-600">Delete comment</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div></div>{editing ? <div className="mt-3 flex items-center gap-2"><input autoFocus value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false); }} className="min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-2 py-1 text-[15px] outline-none focus:border-gray-500 dark:border-gray-600" /><button onClick={save} aria-label="Save comment" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><Check size={16} /></button><button onClick={() => setEditing(false)} aria-label="Cancel edit" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button></div> : <p className="mt-3 text-[15px] text-gray-800 dark:text-gray-200">{comment.text}</p>}{comment.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{comment.attachments.map((attachment) => <a key={attachment.name} href={attachment.dataUrl} download={attachment.name} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><Paperclip size={12} />{attachment.name}</a>)}</div> : null}{comment.reactions?.length ? <div className="mt-3 flex gap-1">{comment.reactions.map((emoji) => <span key={emoji} className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] dark:bg-gray-800">{emoji}</span>)}</div> : null}</div>{replyInput}</div>;
}

function CommentsSection({ taskId, author }: { taskId: string; author: string }) {
  const [comments, setComments] = useState<NonNullable<Task['comments']>>([]);
  const [reply, setReply] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const replyFileInput = useRef<HTMLInputElement>(null);
  const commentFileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { apiFetch(`/tasks/${taskId}`).then((item) => setComments(item.comments || [])).catch(console.error); }, [taskId]);
  const readAttachment = (file: File) => new Promise<{ name: string; dataUrl: string; type: string }>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result), type: file.type || 'application/octet-stream' }); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
  const submit = async (value: string, files: File[], clear: () => void) => { const text = value.trim() || (files.length ? `Attached ${files.map((file) => file.name).join(', ')}` : ''); if (!text) return; const currentUser = JSON.parse(localStorage.getItem('tms-user') || 'null'); const previous = comments; setComments((items) => [...items, { author: currentUser?.name || author, text, createdAt: new Date().toISOString(), attachments: files.map((file) => ({ name: file.name, dataUrl: '', type: file.type })) }]); clear(); try { const attachments = await Promise.all(files.map(readAttachment)); const saved = await apiFetch(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text, attachments }) }); setComments(saved.comments || previous); } catch { setComments(previous); } };
  const applyServerComments = async (request: () => Promise<any>, previous: Comment[]) => { try { const saved = await request(); setComments(saved.comments || previous); } catch { setComments(previous); } };
  const addReaction = (comment: Comment, emoji: string) => { if (!comment._id) return; const previous = comments; setComments((items) => items.map((item) => item._id === comment._id ? { ...item, reactions: Array.from(new Set([...(item.reactions || []), emoji])) } : item)); applyServerComments(() => apiFetch(`/tasks/${taskId}/comments/${comment._id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }), previous); };
  const editComment = (comment: Comment, text: string) => { if (!comment._id) return; const previous = comments; setComments((items) => items.map((item) => item._id === comment._id ? { ...item, text } : item)); applyServerComments(() => apiFetch(`/tasks/${taskId}/comments/${comment._id}`, { method: 'PATCH', body: JSON.stringify({ text }) }), previous); };
  const deleteComment = (comment: Comment) => { if (!comment._id || !window.confirm('Delete this comment?')) return; const previous = comments; setComments((items) => items.filter((item) => item._id !== comment._id)); applyServerComments(() => apiFetch(`/tasks/${taskId}/comments/${comment._id}`, { method: 'DELETE' }), previous); };
  const replyInput = <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 dark:border-gray-700 px-4 py-3"><Avatar name={author} size={6} /><input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); }); }} placeholder="Leave a reply..." className="flex-1 min-w-[120px] bg-transparent text-[13px] outline-none placeholder:text-gray-400" /><input ref={replyFileInput} onChange={(event) => setReplyFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => replyFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); })} aria-label="Send reply" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"><Send size={17} /></button>{replyFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div>;
  return <section className="mt-6 space-y-6">{comments.map((comment, index) => <CommentCard key={comment._id || `${comment.createdAt}-${index}`} comment={comment} replyInput={replyInput} onReaction={addReaction} onEdit={editComment} onDelete={deleteComment} />)}<div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-4 py-4 dark:bg-gray-900 shadow-[0_1px_1px_rgba(0,0,0,0.04)]"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); }); }} placeholder="Add a comment..." className="flex-1 min-w-[120px] bg-transparent text-[15px] outline-none placeholder:text-gray-400" /><input ref={commentFileInput} onChange={(event) => setNewCommentFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => commentFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); })} aria-label="Send comment" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"><Send size={17} /></button>{newCommentFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div></section>;
}

function FieldPicker({ fields, onChange, trigger }: { fields: Record<DetailField, boolean>; onChange: (fields: Record<DetailField, boolean>) => void; trigger: React.ReactNode }) {
  return <Popover><PopoverTrigger asChild>{trigger}</PopoverTrigger><PopoverContent align="end" className="w-48 p-1"><p className="px-2 py-1 text-xs text-gray-500">Visible fields</p>{DETAIL_FIELDS.map((field) => <button key={field} onClick={() => onChange({ ...fields, [field]: !fields[field] })} className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800"><span>{field}</span>{fields[field] && <Check size={14} />}</button>)}</PopoverContent></Popover>;
}

function LegacyRightPanel({ task, onUpdate }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown> }) {
  const [fields, setFields] = useState<Record<DetailField, boolean>>({ Status: true, Priority: true, Members: true, Dates: true, Labels: true, Teams: true, Reporter: true });
  const locked = Boolean(task.locked);
  const statusDots: Record<string, string> = { 'To Do': 'bg-amber-500', Doing: 'bg-blue-500', Completed: 'bg-green-500', 'On Hold': 'bg-orange-400' };
  const pickerTrigger = <button aria-label="Manage detail fields" className="p-1 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><Plus size={15} /></button>;
  const gearTrigger = <button aria-label="Details settings" className="p-1 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"><Settings size={15} /></button>;
  return <div className="flex flex-col gap-4"><div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-visible bg-white dark:bg-gray-900 shadow-sm"><div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800"><div className="flex gap-2 font-semibold text-sm"><ChevronDown size={14} /><span>Details</span></div><div className="flex gap-1 text-gray-400"><FieldPicker fields={fields} onChange={setFields} trigger={pickerTrigger} /><FieldPicker fields={fields} onChange={setFields} trigger={gearTrigger} /></div></div><div className="px-4 py-3 flex flex-col gap-4">{fields.Status && <DetailRow label="Status"><span className="flex items-center gap-2 text-[13px] font-medium"><span className={`w-2.5 h-2.5 rounded-full ${statusDots[task.status] || 'bg-gray-400'}`} />{task.status}</span></DetailRow>}{fields.Priority && <DetailRow label="Priority"><PriorityDropdown value={(task.priority as Priority) || 'No Priority'} onChange={(priority) => onUpdate({ priority })} disabled={locked} /></DetailRow>}{fields.Members && <DetailRow label="Members"><AssignMemberPopover taskId={task._id} currentMembers={task.members || (task.assignee ? [task.assignee] : [])} onUpdate={(members) => onUpdate({ members, assignee: members[0] || '' })} disabled={locked} trigger={<button className="flex items-center gap-1.5 text-[13px] font-medium"><Users size={14} className="text-gray-400" />{task.members?.[0] || task.assignee || 'Add members'}</button>} /></DetailRow>}{fields.Dates && <DetailRow label="Dates"><DatesField task={task} onUpdate={onUpdate} disabled={locked} /></DetailRow>}{fields.Labels && <DetailRow label="Labels"><LabelEditor tags={task.tags || []} onUpdate={(tags) => onUpdate({ tags })} disabled={locked} /></DetailRow>}{fields.Teams && <DetailRow label="Teams"><TeamPicker team={task.team} onUpdate={(team) => onUpdate({ team })} disabled={locked} /></DetailRow>}{fields.Reporter && <DetailRow label="Reporter"><span className="text-[13px] text-gray-700 dark:text-gray-300">{task.reporterName || 'Guest'}</span></DetailRow>}</div></div></div>;
}

function RightPanel({ task, onUpdate }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown> }) {
  const [fields, setFields] = useState<Record<DetailField, boolean>>({ Status: true, Priority: true, Members: true, Dates: true, Labels: true, Teams: true, Reporter: true });
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [updatesOpen, setUpdatesOpen] = useState(true);
  const locked = Boolean(task.locked);
  const statusDots: Record<string, string> = { 'To Do': 'bg-amber-500', Doing: 'bg-blue-500', Completed: 'bg-green-500', 'On Hold': 'bg-orange-400' };
  const detailsTrigger = <button aria-label="Manage detail fields" className="rounded p-1 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100"><Plus size={15} /></button>;
  const settingsTrigger = <button aria-label="Details settings" className="rounded p-1 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100"><Settings size={15} /></button>;

  return (
    <div className="flex flex-col gap-3">
      {/* Details card */}
      <div data-state={detailsOpen ? 'open' : 'closed'} className="details-card overflow-visible rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setDetailsOpen((value) => !value)} className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <ChevronDown size={14} className={`transition-transform ${detailsOpen ? '' : '-rotate-90'}`} />
            <span>Details</span>
          </button>
          <div className="flex gap-1 text-gray-400">
            <FieldPicker fields={fields} onChange={setFields} trigger={detailsTrigger} />
            <FieldPicker fields={fields} onChange={setFields} trigger={settingsTrigger} />
          </div>
        </div>
        {detailsOpen && (
          <div className="flex flex-col">
            {fields.Status && <DetailRow label="Status"><span className="flex items-center gap-2 text-[13px] font-medium"><span className={`w-2.5 h-2.5 rounded-full ${statusDots[task.status] || 'bg-gray-400'}`} />{task.status}</span></DetailRow>}
            {fields.Priority && <DetailRow label="Priority"><PriorityDropdown value={(task.priority as Priority) || 'No Priority'} onChange={(priority) => onUpdate({ priority })} disabled={locked} /></DetailRow>}
            {fields.Members && <DetailRow label="Members"><AssignMemberPopover taskId={task._id} currentMembers={task.members || (task.assignee ? [task.assignee] : [])} onUpdate={(members) => onUpdate({ members, assignee: members[0] || '' })} disabled={locked} trigger={<button className="flex items-center gap-1.5 text-[13px] font-medium"><Users size={14} className="text-gray-400" />{task.members?.[0] || task.assignee || 'Add members'}</button>} /></DetailRow>}
            {fields.Dates && <DetailRow label="Dates"><DatesField task={task} onUpdate={onUpdate} disabled={locked} /></DetailRow>}
            {fields.Labels && <DetailRow label="Labels"><LabelEditor tags={task.tags || []} onUpdate={(tags) => onUpdate({ tags })} disabled={locked} /></DetailRow>}
            {fields.Teams && <DetailRow label="Teams"><TeamPicker team={task.team} onUpdate={(team) => onUpdate({ team })} disabled={locked} /></DetailRow>}
            {fields.Reporter && <DetailRow label="Reporter"><span className="text-[13px] text-gray-700 dark:text-gray-300">{task.reporterName || 'Guest'}</span></DetailRow>}
          </div>
        )}
      </div>
      {/* Updates card */}
      <div className={`w-full flex flex-col gap-3 p-3 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm overflow-hidden${updatesOpen ? ' min-h-[154px]' : ''}`}>
        <button onClick={() => setUpdatesOpen((value) => !value)} className="flex w-full shrink-0 items-center gap-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
          <ChevronDown size={14} className={`transition-transform ${updatesOpen ? '' : '-rotate-90'}`} />
          <span>Updates</span>
        </button>
        {updatesOpen && (
          <div className="flex flex-col gap-3 overflow-auto flex-1">
            <div className="flex items-start gap-2.5">
              <Avatar name={task.reporterName || 'Guest'} size={7} />
              <div className="text-[13px] text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{task.reporterName || 'Guest'}</span>
                <p className="mt-0.5 text-gray-500 dark:text-gray-400">Task details updated</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


}
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-2 px-4 border-b border-gray-50 dark:border-gray-800/60 last:border-0">
      <span className="text-[13px] text-gray-500 dark:text-gray-400 shrink-0 min-w-[64px]">{label}</span>
      <div className="flex justify-end flex-wrap gap-1 min-w-0">{children}</div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [task, setTask] = useState<Task | null>(null);
  const [rightPanel, setRightPanel] = useState(true);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => { apiFetch(`/tasks/${id}`).then(setTask).catch(() => router.replace('/dashboard')).finally(() => setLoading(false)); }, [id, router]);
  const updateTask = useCallback(async (partial: Partial<Task>) => {
    if (!task) return;
    const previous = task;
    setTask({ ...task, ...partial });
    try { const saved = await apiFetch(`/tasks/${task._id}`, { method: 'PATCH', body: JSON.stringify(partial) }); setTask((current) => current ? { ...current, ...saved } : current); return saved; } catch (error) { setTask(previous); throw error; }
  }, [task]);
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard availability is browser dependent */ } };
  const duplicate = async () => { if (!task) return; const copy = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${task.title} (copy)`, status: task.status, projectId: task.projectId, priority: task.priority, members: task.members, tags: task.tags, team: task.team }) }); router.push(`/dashboard/tasks/${copy._id}`); };
  const remove = async () => { if (!task || !window.confirm('Delete this task?')) return; await apiFetch(`/tasks/${task._id}`, { method: 'DELETE' }); router.push('/dashboard'); };
  useEffect(() => {
    if (!task) return;
    const resourceRow = Array.from(document.querySelectorAll('main > div')).find((element) => element.textContent?.trim().startsWith('Resources'));
    const trigger = resourceRow?.querySelector('span:last-child');
    if (!trigger) return;
    trigger.classList.add('cursor-pointer', 'hover:text-gray-700', 'dark:hover:text-gray-200');
    trigger.setAttribute('title', 'Add a document or link');
    const addResource = async () => {
      const url = window.prompt('Paste a document or link URL');
      if (!url?.trim()) return;
      const normalizedUrl = url.trim().match(/^https?:\/\//) ? url.trim() : `https://${url.trim()}`;
      let title = normalizedUrl;
      try { title = new URL(normalizedUrl).hostname.replace(/^www\./, ''); } catch { /* keep URL as title */ }
      await updateTask({ resources: [...(task.resources || []), { title, url: normalizedUrl }] });
      trigger.setAttribute('title', `${(task.resources?.length || 0) + 1} resource(s) saved`);
    };
    trigger.addEventListener('click', addResource);
    return () => trigger.removeEventListener('click', addResource);
  }, [task, updateTask]);
  if (loading) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (!task) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Task not found</div>;
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-start justify-between w-full px-3 sm:px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 gap-2 py-3">
        {/* Left: sidebar toggle + title */}
        <div className="flex items-start gap-2 min-w-0 flex-1 pt-0.5">
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="text-gray-400 lg:hidden shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 -mt-0.5"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold truncate leading-snug">{task.title}</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Task details and discussion</p>
          </div>
        </div>
        {/* Right: icon row — wraps if needed, never clips */}
        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end relative pt-0.5">
          <button
            onClick={() => updateTask({ locked: !task.locked })}
            className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-colors ${task.locked ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700' : 'text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            title={task.locked ? 'Unlock task' : 'Lock task'}
          >
            <Lock size={15} />
          </button>
          <span title="Viewer count" className="h-9 px-2.5 flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 cursor-default">
            <Eye size={15} /><span className="text-[13px]">1</span>
          </span>
          <button
            onClick={share}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Copy task link"
          >
            <Share2 size={15} />
          </button>
          {copied && (
            <span className="absolute top-10 right-0 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
              Link copied
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <MoreHorizontal size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={duplicate}>Duplicate task</DropdownMenuItem>
              <DropdownMenuItem onClick={remove} className="text-red-600 focus:text-red-600">Delete task</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setRightPanel((value) => !value)}
            className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle details panel"
          >
            <PanelRight size={15} />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-white dark:bg-gray-950">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0 overflow-x-hidden">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
            <span className="text-[13px] text-gray-500 font-medium">Properties</span>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1">
              <Avatar name={task.assignee || 'Unassigned'} size={5} />
              <span className="text-[12px]">{task.assignee || 'Unassigned'}</span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1 bg-orange-50 text-orange-500 text-[12px] px-2.5 py-1 rounded-full">
                <CalendarDays size={12} />{formatPillDate(task.dueDate)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
            <span className="text-[13px] text-gray-500 font-medium">Labels</span>
            <LabelEditor tags={task.tags || []} onUpdate={(tags) => updateTask({ tags })} disabled={Boolean(task.locked)} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
            <span className="text-[13px] text-gray-500 font-medium">Resources</span>
            <span className="text-[13px] text-gray-400 flex items-center gap-1.5 flex-wrap">
              <LinkIcon size={13} />Add document or link…
            </span>
          </div>
          {/* Subtasks */}
          <div className="mb-6">
            <SubtasksSection task={task} locked={Boolean(task.locked)} />
          </div>
          <CommentsSection taskId={task._id} author={task.reporterName || 'Guest'} />
        </main>
        {rightPanel && (
          <aside className="w-full lg:w-72 lg:shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 overflow-y-auto p-4 bg-white dark:bg-gray-900">
            <RightPanel task={task} onUpdate={updateTask} />
          </aside>
        )}
      </div>
    </div>
  );
}
