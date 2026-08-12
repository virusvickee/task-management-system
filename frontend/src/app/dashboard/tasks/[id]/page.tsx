'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AtSign, ArrowRight, Calendar, Check, ChevronDown, ChevronRight, Eye,
  Lock, MoreHorizontal, PanelLeftClose, PanelLeftOpen,
  PanelRight, Paperclip, Plus, Send, Settings, Share2, SmilePlus, Tag, UserPlus, X,
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';
import { apiFetch } from '@/lib/api';
import type { Task } from '@/hooks/useTasks';
import DatePickerPopover, { formatFullDate, formatPillDate } from '@/components/DatePickerPopover';
import DateBadgeDestructive from '@/components/ui/DateBadgeDestructive';
import PriorityBars from '@/components/ui/PriorityBars';
import AssignMemberPopover from '@/components/AssignMemberPopover';
import { displayStatus, PRIORITIES, STATUS_DOTS, type Priority } from '@/lib/priority';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LABELS = ['Research', 'Design', 'Development', 'Testing', 'Deployment', 'Frontend', 'Backend', 'DevOps', 'Docs', 'Auth', 'Bug'];
const TEAMS = ['Design', 'Engineering', 'Product', 'QA'];
const DETAIL_FIELDS = ['Status', 'Priority', 'Members', 'Dates', 'Labels', 'Teams', 'Reporter'] as const;
type DetailField = (typeof DETAIL_FIELDS)[number];

type ActivityEntry = {
  id: string;
  type: 'priority' | 'update';
  text: string;
  priority?: Priority;
  author?: string;
  date?: string;
};

/** Figma typography tokens for task details page */
const TYPO = {
  sectionHeading: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  sidebarFieldLabel: 'text-[13px] font-normal text-gray-600 dark:text-gray-400',
  cardHeading: 'text-sm font-semibold text-gray-900 dark:text-gray-100',
  tableHeader: 'text-xs font-medium text-gray-500 dark:text-gray-400',
  commentAuthor: 'text-[13px] font-semibold text-gray-900 dark:text-gray-100',
  commentMeta: 'text-[13px] font-normal text-gray-400 dark:text-gray-500',
  commentBody: 'text-sm font-normal text-gray-800 dark:text-gray-200',
  updateAuthor: 'text-[13px] font-semibold text-gray-900 dark:text-gray-100',
  updateText: 'text-[13px] font-normal text-gray-500 dark:text-gray-400',
};
const AVATAR_COLORS = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500'];

function avatarColor(name: string) {
  return AVATAR_COLORS[[...name].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <span className={`w-${size} h-${size} rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>{initials}</span>;
}

const PAGE_TITLE_STYLE: CSSProperties = {
  opacity: 1,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 600,
  letterSpacing: '-0.4px',
  color: 'var(--base-primary, rgba(23, 23, 23, 1))',
};

const PAGE_DESCRIPTION_STYLE: CSSProperties = {
  opacity: 1,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 400,
  letterSpacing: '0',
  color: 'var(--base-muted-foreground, rgba(115, 115, 115, 1))',
};

function TaskHeaderSection({
  title,
  description,
  locked,
  editing,
  onEditingChange,
  onSave,
}: {
  title: string;
  description: string;
  locked: boolean;
  editing: boolean;
  onEditingChange: (value: boolean) => void;
  onSave: (partial: { title: string; description: string }) => Promise<unknown>;
}) {
  const [titleDraft, setTitleDraft] = useState(title);
  const [descriptionDraft, setDescriptionDraft] = useState(description);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitleDraft(title);
    setDescriptionDraft(description);
  }, [title, description]);

  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  const save = async () => {
    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) return;
    try {
      await onSave({ title: trimmedTitle, description: descriptionDraft.trim() });
      onEditingChange(false);
    } catch {
      setTitleDraft(title);
      setDescriptionDraft(description);
    }
  };

  const cancel = () => {
    setTitleDraft(title);
    setDescriptionDraft(description);
    onEditingChange(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col flex-1 min-w-0 w-full gap-1.5 sm:gap-1.5">
        <input
          ref={titleRef}
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancel();
            if (event.key === 'Enter') { event.preventDefault(); save(); }
          }}
          disabled={locked}
          className="shrink-0 m-0 p-0 w-full bg-transparent outline-none border-none ring-0 focus:ring-0 disabled:opacity-60 text-xl sm:text-2xl font-semibold leading-8 tracking-tight text-[var(--base-primary)]"
          style={PAGE_TITLE_STYLE}
        />
        <textarea
          ref={descriptionRef}
          value={descriptionDraft}
          onChange={(event) => setDescriptionDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancel();
          }}
          disabled={locked}
          placeholder="Add a description…"
          aria-label="Task description"
          className="task-page-description task-page-input w-full shrink-0 resize-none bg-[var(--base-background)] outline-none disabled:cursor-not-allowed disabled:opacity-60 border border-[color:var(--base-border)] rounded-md px-2 py-1.5 text-sm leading-5 min-h-[40px] focus:overflow-y-auto"
          style={PAGE_DESCRIPTION_STYLE}
          rows={2}
        />
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={locked || !titleDraft.trim()}
            className="h-7 px-3 rounded-md text-[12px] font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-45 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancel}
            className="h-7 px-3 rounded-md text-[12px] font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 w-full gap-1.5 sm:gap-1.5">
      <h2
        className="shrink-0 m-0 p-0 w-full text-xl sm:text-2xl font-semibold leading-8 tracking-tight break-words text-[var(--base-primary)]"
        style={PAGE_TITLE_STYLE}
      >
        {title}
      </h2>
      {description ? (
        <p
          className="task-page-description shrink-0 m-0 p-0 w-full text-sm leading-5 break-words whitespace-pre-wrap text-[var(--base-muted-foreground)]"
          style={PAGE_DESCRIPTION_STYLE}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function LabelEditor({ tags, onUpdate, disabled = false, align = 'start' }: { tags: string[]; onUpdate: (tags: string[]) => Promise<unknown>; disabled?: boolean; align?: 'start' | 'center' | 'end' }) {
  const [open, setOpen] = useState(false);
  const alignClass = align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : 'justify-start';
  const toggle = async (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
    try { await onUpdate(next); } catch { /* parent restores optimistic state */ }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`flex flex-wrap gap-1 ${alignClass} ${disabled ? 'opacity-45' : ''}`}>
        {tags.map((tag) => (
          <span key={tag} onClick={() => !disabled && setOpen(true)} className="cursor-pointer bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700">
            <Tag size={11} className="text-gray-500 dark:text-gray-400" strokeWidth={1.75} />{tag}
            {!disabled && <button aria-label={`Remove ${tag} label`} onClick={(event) => { event.stopPropagation(); toggle(tag); }} className="-mr-0.5 opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] rounded"><X size={11} /></button>}
          </span>
        ))}
        {!disabled && <PopoverTrigger asChild><button aria-label="Add label" className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] flex items-center justify-center"><Plus size={12} strokeWidth={1.75} /></button></PopoverTrigger>}
      </div>
      <PopoverContent align="end" className="w-44 p-1">
        {LABELS.map((tag) => <button key={tag} onClick={() => toggle(tag)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Tag size={13} className="text-gray-400 dark:text-gray-500" /><span className="flex-1">{tag}</span>{tags.includes(tag) && <Check size={14} className="text-gray-700 dark:text-gray-300" />}
        </button>)}
      </PopoverContent>
    </Popover>
  );
}

function TeamPicker({ team, onUpdate, disabled = false }: { team?: string; onUpdate: (team: string) => Promise<unknown>; disabled?: boolean }) {
  return <Popover><PopoverTrigger asChild><button disabled={disabled} className={`text-[13px] ${team ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}>{team || '—'}</button></PopoverTrigger><PopoverContent align="end" className="w-40 p-1">
    {TEAMS.map((option) => <button key={option} onClick={() => onUpdate(option)} className="w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><span>{option}</span>{team === option && <Check size={14} className="text-gray-700 dark:text-gray-300" />}</button>)}
  </PopoverContent></Popover>;
}

function PriorityDropdown({ value, onChange, disabled = false, menuAlign = 'end' }: { value: Priority; onChange: (value: Priority) => Promise<unknown>; disabled?: boolean; menuAlign?: 'start' | 'center' | 'end' }) {
  const current = PRIORITIES.find((item) => item.label === value) || PRIORITIES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button disabled={disabled} className={`flex items-center gap-1.5 text-[13px] font-medium ${current.textColor} ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:opacity-80'}`}>
          <PriorityBars priority={value} size={12} />
          <span>{value === 'No Priority' ? '—' : value}</span>
          <ChevronDown size={13} className="text-gray-500 dark:text-gray-400" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={menuAlign} className="w-44 p-1">
        <p className="px-2 py-1 text-[11px] text-gray-400 dark:text-gray-500">Priority</p>
        {PRIORITIES.map((option) => (
          <DropdownMenuItem key={option.label} onClick={() => onChange(option.label)} className="flex items-center gap-2">
            <PriorityBars priority={option.label} size={12} />
            <span className={`flex-1 ${option.textColor}`}>{option.label}</span>
            {option.label === value && <Check size={12} className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const pillClass = (hasValue: boolean) =>
    `h-7 px-2.5 border border-[color:var(--base-border)] rounded-md text-[12px] flex items-center gap-1.5 bg-[var(--base-background)] shrink-0 ${
      disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
    } ${hasValue ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`;

  return (
    <div className="relative flex flex-wrap items-center justify-start sm:justify-end gap-1 w-full">
      <button ref={startBtnRef} disabled={disabled} onClick={() => setActivePicker('start')} className={pillClass(Boolean(startDate))}>
        <Calendar size={12} className="text-gray-400 shrink-0" strokeWidth={1.75} />
        <span>{formatPillDate(startDate) || 'Start'}</span>
      </button>
      <ArrowRight size={12} className="text-gray-400 shrink-0" strokeWidth={1.75} />
      <button ref={endBtnRef} disabled={disabled} onClick={() => setActivePicker('end')} className={pillClass(Boolean(endDate))}>
        <Calendar size={12} className="text-gray-400 shrink-0" strokeWidth={1.75} />
        <span>{formatPillDate(endDate) || 'End'}</span>
      </button>
      {activePicker && <DatePickerPopover anchorRef={activePicker === 'start' ? startBtnRef : endBtnRef} selectedDate={activePicker === 'start' ? startDate : endDate} onSelectDate={selectDate} onClose={() => setActivePicker(null)} />}
    </div>
  );
}

function SubtaskDueDate({ task, onUpdate, disabled = false, open, onOpenChange }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown>; disabled?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const date = task.dueDate || task.endDate || null;
  const isOpen = open ?? internalOpen;
  const btnRef = useRef<HTMLButtonElement>(null);
  const toggleOpen = (value: boolean) => { if (open === undefined) setInternalOpen(value); onOpenChange?.(value); };
  return <div className="relative"><button ref={btnRef} data-subtask-date={task._id} disabled={disabled} onClick={() => toggleOpen(!isOpen)} className={`rounded px-1 py-1 text-[13px] text-gray-600 dark:text-gray-300 ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{formatFullDate(date) || 'Add date'}</button>{isOpen && <DatePickerPopover anchorRef={btnRef} selectedDate={date} onSelectDate={async (value) => { await onUpdate({ dueDate: value, endDate: value }); toggleOpen(false); }} onClose={() => toggleOpen(false)} />}</div>;
}

function SubtasksSection({
  task,
  locked,
  onSubtasksChange,
}: {
  task: Task;
  locked: boolean;
  onSubtasksChange?: (subtasks: Task[]) => void;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>((task as Task & { subtasks?: Task[] }).subtasks || []);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const syncSubtasks = useCallback((next: Task[]) => {
    setSubtasks(next);
    onSubtasksChange?.(next);
  }, [onSubtasksChange]);

  useEffect(() => {
    syncSubtasks((task as Task & { subtasks?: Task[] }).subtasks || []);
  }, [task._id]); // eslint-disable-line react-hooks/exhaustive-deps -- only reload when navigating to a different task

  const updateSubtask = async (subtaskId: string, partial: Partial<Task>) => {
    const previous = subtasks;
    const optimistic = subtasks.map((item) => item._id === subtaskId ? { ...item, ...partial } : item);
    syncSubtasks(optimistic);
    try {
      const saved = await apiFetch(`/tasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(partial) });
      syncSubtasks(optimistic.map((item) => item._id === subtaskId ? saved : item));
      return saved;
    } catch (error) {
      syncSubtasks(previous);
      throw error;
    }
  };

  const addSubtask = async () => {
    const trimmed = inputRef.current?.value.trim() || '';
    if (!trimmed) { setAdding(false); return; }
    const temporary: Task = { _id: `tmp-${Date.now()}`, title: trimmed, status: 'To Do', tags: [], parentTaskId: task._id, projectId: task.projectId };
    const previous = subtasks;
    const optimistic = [...subtasks, temporary];
    syncSubtasks(optimistic);
    if (inputRef.current) inputRef.current.value = '';
    setAdding(false);
    try {
      const saved = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: trimmed,
          status: 'To Do',
          projectId: task.projectId,
          parentTaskId: task._id,
        }),
      });
      syncSubtasks(optimistic.map((item) => item._id === temporary._id ? saved : item));
    } catch {
      syncSubtasks(previous);
    }
  };

  const duplicate = async (subtask: Task) => {
    const saved = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${subtask.title} (copy)`, status: subtask.status, projectId: subtask.projectId, parentTaskId: task._id, priority: subtask.priority, members: subtask.members, tags: subtask.tags }) });
    syncSubtasks([...subtasks, saved]);
  };

  const remove = async (subtask: Task) => {
    if (!window.confirm('Delete this subtask?')) return;
    const previous = subtasks;
    const optimistic = subtasks.filter((item) => item._id !== subtask._id);
    syncSubtasks(optimistic);
    try {
      await apiFetch(`/tasks/${subtask._id}`, { method: 'DELETE' });
    } catch {
      syncSubtasks(previous);
    }
  };
  const changeStatus = (subtask: Task) => { const statuses = ['To Do', 'Doing', 'On Hold', 'Completed']; const next = statuses[(statuses.indexOf(subtask.status) + 1) % statuses.length]; return updateSubtask(subtask._id, { status: next }); };
  const changePriority = (subtask: Task) => { const index = PRIORITIES.findIndex((item) => item.label === subtask.priority); return updateSubtask(subtask._id, { priority: PRIORITIES[(index + 1) % PRIORITIES.length].label }); };
  const setDueDate = (subtask: Task) => { window.setTimeout(() => document.querySelector<HTMLButtonElement>(`[data-subtask-date="${subtask._id}"]`)?.click(), 0); };
  const moveParent = async (subtask: Task) => { const parentTaskId = window.prompt('Enter the new parent task ID', task._id); if (parentTaskId?.trim() && parentTaskId.trim() !== task._id) { await updateSubtask(subtask._id, { parentTaskId: parentTaskId.trim() }); setSubtasks((items) => items.filter((item) => item._id !== subtask._id)); } };
  return <div><button onClick={() => setCollapsed((v) => !v)} className={`flex items-center gap-1.5 ${TYPO.sectionHeading} mb-2`}>{collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}Subtasks</button>{!collapsed && <div className="rounded-md overflow-hidden border border-[color:var(--base-border)] bg-[var(--base-background)]"><div className="overflow-x-auto overscroll-x-contain scrollbar-none"><table className="w-full min-w-[520px] border-collapse"><thead><tr className="bg-gray-50 dark:bg-gray-800/60"><th className={`px-2 sm:px-4 py-2 text-left ${TYPO.tableHeader}`}>Task</th><th className={`px-2 sm:px-4 py-2 text-left ${TYPO.tableHeader}`}>Priority</th><th className={`px-2 sm:px-4 py-2 text-left ${TYPO.tableHeader}`}>Members</th><th className={`px-2 sm:px-4 py-2 text-left ${TYPO.tableHeader}`}>Due Date</th><th className={`px-2 sm:px-4 py-2 text-right ${TYPO.tableHeader}`}>Actions</th></tr></thead><tbody>{subtasks.map((subtask) => { const member = subtask.members?.[0] || subtask.assignee; return <tr key={subtask._id} className="h-12 border-t border-gray-100 dark:border-gray-800"><td className="px-2 sm:px-4 py-2 text-[13px] font-medium text-gray-900 dark:text-gray-100">{subtask.title}</td><td className="px-2 sm:px-4 py-2"><PriorityDropdown value={(subtask.priority as Priority) || 'No Priority'} onChange={(priority) => updateSubtask(subtask._id, { priority })} disabled={locked} /></td><td className="px-2 sm:px-4 py-2"><AssignMemberPopover taskId={subtask._id} currentMembers={subtask.members || (subtask.assignee ? [subtask.assignee] : [])} onUpdate={(members) => updateSubtask(subtask._id, { members, assignee: members[0] || '' })} disabled={locked} trigger={member ? <button className="min-w-[40px] min-h-[40px] flex items-center justify-center"><Avatar name={member} size={7} /></button> : <button className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500"><Plus size={13} /></button>} /></td><td className="px-2 sm:px-4 py-2"><SubtaskDueDate task={subtask} onUpdate={(partial) => updateSubtask(subtask._id, partial)} disabled={locked} /></td><td className="px-2 sm:px-4 py-2 text-right"><DropdownMenu><DropdownMenuTrigger asChild><button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-100 min-w-[40px] min-h-[40px] flex items-center justify-center"><MoreHorizontal size={16} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/dashboard/tasks/${subtask._id}`)}>Edit</DropdownMenuItem><DropdownMenuItem onClick={() => duplicate(subtask)}>Duplicate</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => updateSubtask(subtask._id, { status: 'Completed' })}>Mark complete</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => changeStatus(subtask)}>Change status</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => changePriority(subtask)}>Set priority</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => setDueDate(subtask)}>Set due date</DropdownMenuItem><DropdownMenuItem disabled={locked} onClick={() => moveParent(subtask)}>Move to another parent task</DropdownMenuItem><DropdownMenuItem onClick={() => remove(subtask)} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></td></tr>; })}</tbody></table></div><div className="border-t border-gray-100 dark:border-gray-800 px-2 sm:px-4 py-2.5">{adding ? <input ref={inputRef} autoFocus placeholder="Subtask title…" className="task-page-input w-full bg-transparent text-[13px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500" onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') setAdding(false); }} /> : <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[13px] text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-100"><Plus size={14} />Add Subtasks</button>}</div></div>}</div>;
}

function formatRelativeTime(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
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

  return <div className="overflow-hidden rounded-lg border border-[color:var(--base-border)] bg-[var(--base-background)]"><div className="px-3 sm:px-4 py-4"><div className="flex flex-wrap items-center gap-2"><Avatar name={comment.author} size={7} /><span className={TYPO.commentAuthor}>{comment.author}</span><span className={TYPO.commentMeta}>{formatRelativeTime(comment.createdAt)}</span><div className="ml-auto flex items-center gap-2 text-gray-800 dark:text-gray-200"><Popover><PopoverTrigger asChild><button title="Add reaction" className="rounded p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><SmilePlus size={18} /></button></PopoverTrigger><PopoverContent className="w-auto p-1"><div className="flex gap-1">{['👍', '🎉', '❤️', '😂'].map((emoji) => <button key={emoji} onClick={() => onReaction(comment, emoji)} className="rounded p-1 text-base hover:bg-gray-100 dark:hover:bg-gray-800">{emoji}</button>)}</div></PopoverContent></Popover><DropdownMenu><DropdownMenuTrigger asChild><button title="More actions" className="rounded p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><MoreHorizontal size={17} /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => navigator.clipboard.writeText(comment.text)}>Copy comment</DropdownMenuItem>{comment._id && <DropdownMenuItem onClick={() => { setText(comment.text); setEditing(true); }}>Edit comment</DropdownMenuItem>}{comment._id && <DropdownMenuItem onClick={() => onDelete(comment)} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">Delete comment</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div></div>{editing ? <div className="mt-3 flex items-center gap-2"><input autoFocus value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') save(); if (event.key === 'Escape') setEditing(false); }} className="task-page-input min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:focus:border-gray-400" /><button onClick={save} aria-label="Save comment" className="rounded p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><Check size={16} /></button><button onClick={() => setEditing(false)} aria-label="Cancel edit" className="rounded p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={16} /></button></div> : <p className="mt-3 text-sm font-normal text-gray-800 dark:text-gray-200">{comment.text}</p>}{comment.attachments?.length ? <div className="mt-3 flex flex-wrap gap-2">{comment.attachments.map((attachment) => <a key={attachment.name} href={attachment.dataUrl} download={attachment.name} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"><Paperclip size={12} />{attachment.name}</a>)}</div> : null}{comment.reactions?.length ? <div className="mt-3 flex gap-1">{comment.reactions.map((emoji) => <span key={emoji} className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] dark:bg-gray-800">{emoji}</span>)}</div> : null}</div>{replyInput}</div>;
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
  const replyInput = <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--base-border)] px-3 sm:px-4 py-3"><Avatar name={author} size={6} /><input value={reply} onChange={(event) => setReply(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); }); }} placeholder="Leave a reply..." className="task-page-input flex-1 min-w-[120px] bg-transparent text-[13px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500" /><input ref={replyFileInput} onChange={(event) => setReplyFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => replyFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(reply, replyFiles, () => { setReply(''); setReplyFiles([]); })} aria-label="Send reply" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"><Send size={17} /></button>{replyFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500 dark:text-gray-400"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div>;
  return <section className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">{comments.map((comment, index) => <CommentCard key={comment._id || `${comment.createdAt}-${index}`} comment={comment} replyInput={replyInput} onReaction={addReaction} onEdit={editComment} onDelete={deleteComment} />)}<div className="flex flex-wrap items-center gap-3 rounded-lg border border-[color:var(--base-border)] bg-[var(--base-background)] px-3 sm:px-4 py-4"><input value={newComment} onChange={(event) => setNewComment(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); }); }} placeholder="Add a comment..." className="task-page-input flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500" /><input ref={commentFileInput} onChange={(event) => setNewCommentFiles(Array.from(event.target.files || []))} type="file" className="hidden" /><button onClick={() => commentFileInput.current?.click()} title="Attach file" aria-label="Attach file" className="rounded p-1 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"><Paperclip size={16} /></button><button onClick={() => submit(newComment, newCommentFiles, () => { setNewComment(''); setNewCommentFiles([]); })} aria-label="Send comment" className="rounded p-1 text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"><Send size={17} /></button>{newCommentFiles.map((file) => <span key={file.name} className="w-full text-[11px] text-gray-500 dark:text-gray-400"><Paperclip size={11} className="inline" /> {file.name}</span>)}</div></section>;
}

function FieldPicker({ fields, onChange, trigger }: { fields: Record<DetailField, boolean>; onChange: (fields: Record<DetailField, boolean>) => void; trigger: React.ReactNode }) {
  return <Popover><PopoverTrigger asChild>{trigger}</PopoverTrigger><PopoverContent align="end" className="w-48 p-1"><p className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Visible fields</p>{DETAIL_FIELDS.map((field) => <button key={field} onClick={() => onChange({ ...fields, [field]: !fields[field] })} className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"><span>{field}</span>{fields[field] && <Check size={14} className="text-gray-700 dark:text-gray-300" />}</button>)}</PopoverContent></Popover>;
}

function UpdatesSection({ entries }: { entries: ActivityEntry[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`w-full flex flex-col gap-3 p-3 rounded-lg border border-[color:var(--base-border)] bg-[var(--base-background)] shadow-sm overflow-hidden${open ? ' min-h-0 sm:min-h-[154px]' : ''}`}>
      <button onClick={() => setOpen((value) => !value)} className={`flex w-full shrink-0 items-center gap-2 text-left ${TYPO.cardHeading}`}>
        <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        <span>Updates</span>
      </button>
      {open && (
        <div className="flex flex-col gap-3 overflow-auto flex-1">
          {entries.length === 0 ? (
            <p className="text-[13px] text-gray-400 dark:text-gray-500 px-1">No updates yet</p>
          ) : entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2.5">
              {entry.type === 'priority' ? (
                <span className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                  <PriorityBars priority={entry.priority || 'Urgent'} size={12} />
                </span>
              ) : (
                <Avatar name={entry.author || 'You'} size={7} />
              )}
              <div className={`${TYPO.updateText} min-w-0`}>
                <span className={TYPO.updateAuthor}>You</span>
                <span> {entry.text}</span>
                {entry.date && <span className="text-gray-400 dark:text-gray-500"> · {entry.date}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RightPanel({ task, onUpdate, activities }: { task: Task; onUpdate: (partial: Partial<Task>) => Promise<unknown>; activities: ActivityEntry[] }) {
  const [fields, setFields] = useState<Record<DetailField, boolean>>({ Status: true, Priority: true, Members: true, Dates: true, Labels: true, Teams: true, Reporter: true });
  const [detailsOpen, setDetailsOpen] = useState(true);
  const locked = Boolean(task.locked);
  const statusLabel = displayStatus(task.status);
  const statusDot = STATUS_DOTS[task.status] || STATUS_DOTS.Backlog;
  const detailsTrigger = <button aria-label="Manage detail fields" className="rounded p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"><Plus size={14} strokeWidth={1.75} /></button>;
  const settingsTrigger = <button aria-label="Details settings" className="rounded p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"><Settings size={14} strokeWidth={1.75} /></button>;

  return (
    <div className="flex flex-col gap-3">
      <div data-state={detailsOpen ? 'open' : 'closed'} className="details-card overflow-visible rounded-lg border border-[color:var(--base-border)] bg-[var(--base-background)] shadow-sm">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setDetailsOpen((value) => !value)} className={`flex items-center gap-2 ${TYPO.cardHeading}`}>
            <ChevronDown size={14} className={`transition-transform text-gray-500 dark:text-gray-400 ${detailsOpen ? '' : '-rotate-90'}`} strokeWidth={1.75} />
            <span>Details</span>
          </button>
          <div className="flex gap-1 text-gray-400">
            <FieldPicker fields={fields} onChange={setFields} trigger={detailsTrigger} />
            <FieldPicker fields={fields} onChange={setFields} trigger={settingsTrigger} />
          </div>
        </div>
        {detailsOpen && (
          <div className="flex flex-col">
            {fields.Status && <DetailRow label="Status"><span className="flex items-center gap-2 text-[13px] font-medium text-gray-900 dark:text-gray-100"><span className={`w-2 h-2 rounded-full ${statusDot}`} />{statusLabel}</span></DetailRow>}
            {fields.Priority && <DetailRow label="Priority"><PriorityDropdown value={(task.priority as Priority) || 'No Priority'} onChange={(priority) => onUpdate({ priority })} disabled={locked} /></DetailRow>}
            {fields.Members && <DetailRow label="Members"><AssignMemberPopover taskId={task._id} currentMembers={task.members || (task.assignee ? [task.assignee] : [])} onUpdate={(members) => onUpdate({ members, assignee: members[0] || '' })} disabled={locked} trigger={<button className={`flex items-center gap-1.5 text-[13px] font-medium ${task.members?.[0] || task.assignee ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}><UserPlus size={14} className="text-gray-500 dark:text-gray-400 shrink-0" strokeWidth={1.75} /><span>{task.members?.[0] || task.assignee || 'Add members'}</span></button>} /></DetailRow>}
            {fields.Dates && <DetailRow label="Dates"><DatesField task={task} onUpdate={onUpdate} disabled={locked} /></DetailRow>}
            {fields.Labels && <DetailRow label="Labels"><LabelEditor tags={task.tags || []} onUpdate={(tags) => onUpdate({ tags })} disabled={locked} align="end" /></DetailRow>}
            {fields.Teams && <DetailRow label="Teams"><TeamPicker team={task.team} onUpdate={(team) => onUpdate({ team })} disabled={locked} /></DetailRow>}
            {fields.Reporter && <DetailRow label="Reporter"><span className="text-[13px] text-gray-700 dark:text-gray-300">{task.reporterName || 'Guest'}</span></DetailRow>}
          </div>
        )}
      </div>
      <UpdatesSection entries={activities} />
    </div>
  );
}
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-x-3 py-2.5 px-3 sm:px-4">
      <span className={`${TYPO.sidebarFieldLabel} shrink-0`}>{label}</span>
      <div className="flex justify-start sm:justify-end items-center flex-wrap gap-1 min-w-0 w-full sm:w-auto">{children}</div>
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
  const [headerEditing, setHeaderEditing] = useState(false);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  useEffect(() => {
    if (window.innerWidth < 1024) setRightPanel(false);
  }, []);
  useEffect(() => { apiFetch(`/tasks/${id}`).then(setTask).catch(() => router.replace('/dashboard')).finally(() => setLoading(false)); }, [id, router]);
  const updateTask = useCallback(async (partial: Partial<Task>) => {
    if (!task) return;
    const previous = task;
    if (partial.priority && partial.priority !== task.priority) {
      const from = (task.priority as Priority) || 'No Priority';
      const to = partial.priority as Priority;
      setActivities((items) => [{
        id: `priority-${Date.now()}`,
        type: 'priority',
        priority: to,
        text: `changed priority from ${from} to ${to}`,
      }, ...items]);
    }
    setTask({ ...task, ...partial });
    try {
      const saved = await apiFetch(`/tasks/${task._id}`, { method: 'PATCH', body: JSON.stringify(partial) });
      setTask((current) => current ? {
        ...current,
        ...saved,
        description: saved.description ?? partial.description ?? current.description,
        subtasks: current.subtasks,
      } : current);
      return saved;
    } catch (error) {
      setTask(previous);
      throw error;
    }
  }, [task]);
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard availability is browser dependent */ } };
  const duplicate = async () => { if (!task) return; const copy = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${task.title} (copy)`, status: task.status, projectId: task.projectId, priority: task.priority, members: task.members, tags: task.tags, team: task.team }) }); router.push(`/dashboard/tasks/${copy._id}`); };
  const remove = async () => { if (!task || !window.confirm('Delete this task?')) return; await apiFetch(`/tasks/${task._id}`, { method: 'DELETE' }); router.push('/dashboard'); };
  if (loading) return <div className="flex-1 flex items-center justify-center bg-[var(--background)] text-gray-400 dark:text-gray-500 text-sm">Loading…</div>;
  if (!task) return <div className="flex-1 flex items-center justify-center bg-[var(--background)] text-gray-400 dark:text-gray-500 text-sm">Task not found</div>;
  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[var(--background)]">
      {/* ── Header ── */}
      <header className="flex items-center w-full h-14 px-3 sm:px-4 bg-[var(--base-background)] shrink-0 border-b border-[color:var(--base-border)]">
        <button onClick={() => setSidebarOpen((value) => !value)} className="text-gray-400 dark:text-gray-500 shrink-0 w-9 h-9 flex items-center justify-center rounded-md hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Toggle sidebar">
          {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex-col bg-[var(--background)] p-2 sm:p-2 gap-4 sm:gap-5">
        {/* Title + actions */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4 px-2 sm:px-4 pt-3 sm:pt-4 min-w-0 shrink-0">
          <TaskHeaderSection
            title={task.title}
            description={task.description || ''}
            locked={Boolean(task.locked)}
            editing={headerEditing}
            onEditingChange={setHeaderEditing}
            onSave={async ({ title, description }) => updateTask({ title, description })}
          />
          <div className="flex items-center gap-1 sm:gap-1.5 relative shrink-0 self-end md:self-auto overflow-x-auto max-w-full pb-0.5">
            <button onClick={() => updateTask({ locked: !task.locked })} className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors shrink-0 ${task.locked ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700' : 'text-gray-900 border-[color:var(--base-border)] hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800'}`}><Lock size={14} strokeWidth={1.75} /></button>
            <span className="h-8 px-2 flex items-center gap-1 border border-[color:var(--base-border)] rounded-lg text-indigo-500 dark:text-indigo-400 cursor-default shrink-0"><Eye size={14} /><span className="text-[12px] font-medium hidden min-[420px]:inline">1</span></span>
            <button onClick={share} className="w-8 h-8 flex items-center justify-center border border-[color:var(--base-border)] rounded-lg text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><Share2 size={14} strokeWidth={1.75} /></button>
            {copied && <span className="absolute top-10 right-0 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">Link copied</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 flex items-center justify-center border border-[color:var(--base-border)] rounded-lg text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"><MoreHorizontal size={14} strokeWidth={1.75} /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={Boolean(task.locked)}
                  onClick={() => setHeaderEditing(true)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={duplicate}>Duplicate task</DropdownMenuItem>
                <DropdownMenuItem onClick={remove} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">Delete task</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => setRightPanel((v) => !v)} className={`w-8 h-8 flex items-center justify-center border rounded-lg transition-colors shrink-0 ${rightPanel ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-[color:var(--base-border)]' : 'text-gray-900 border-[color:var(--base-border)] hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800'}`}><PanelRight size={14} strokeWidth={1.75} /></button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 lg:overflow-hidden gap-4 lg:gap-5">
        {/* Left: main content */}
        <main className="flex-1 lg:overflow-y-auto min-w-0 scrollbar-none bg-[var(--background)] flex flex-col gap-4 sm:gap-5 px-2 sm:px-4 pb-4 lg:pb-4">
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-x-6 sm:gap-y-2 min-h-[44px] py-2">
              <span className={`${TYPO.sectionHeading} shrink-0 min-w-[72px] sm:min-w-[80px]`}>Properties</span>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-1">
                  <Avatar name={task.assignee || task.team || 'Designer'} size={5} />
                  <span className="text-[12px] text-gray-700 dark:text-gray-300">{task.team || 'Designer'}</span>
                </div>
                {task.dueDate && <DateBadgeDestructive badgeText={formatPillDate(task.dueDate) || ''} />}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-x-6 sm:gap-y-2 min-h-[44px] py-2">
              <span className={`${TYPO.sectionHeading} shrink-0 min-w-[72px] sm:min-w-[80px]`}>Labels</span>
              <LabelEditor tags={task.tags || []} onUpdate={(tags) => updateTask({ tags })} disabled={Boolean(task.locked)} />
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-x-6 sm:gap-y-2 min-h-[44px] py-2">
              <span className={`${TYPO.sectionHeading} shrink-0 min-w-[72px] sm:min-w-[80px]`}>Resources</span>
              <button
                type="button"
                onClick={async () => {
                  const url = window.prompt('Paste a document or link URL');
                  if (!url?.trim()) return;
                  const normalizedUrl = url.trim().match(/^https?:\/\//) ? url.trim() : `https://${url.trim()}`;
                  let title = normalizedUrl;
                  try { title = new URL(normalizedUrl).hostname.replace(/^www\./, ''); } catch { /* keep URL as title */ }
                  await updateTask({ resources: [...(task.resources || []), { title, url: normalizedUrl }] });
                  setActivities((items) => [{
                    id: `update-${Date.now()}`,
                    type: 'update',
                    author: task.reporterName || 'You',
                    text: 'posted an update',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  }, ...items]);
                }}
                className="text-[13px] text-gray-400 dark:text-gray-500 flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 text-left"
              >
                <AtSign size={13} />Add document or link…
              </button>
            </div>
          </div>
          <SubtasksSection
            task={task}
            locked={Boolean(task.locked)}
            onSubtasksChange={(subtasks) => setTask((current) => current ? { ...current, subtasks } as Task & { subtasks: Task[] } : current)}
          />
          <CommentsSection taskId={task._id} author={task.reporterName || 'Guest'} />
        </main>

        {/* Right: Details panel */}
        {rightPanel && (
          <aside className="w-full lg:w-[323px] shrink-0 lg:overflow-y-auto scrollbar-none bg-[var(--background)] flex flex-col gap-4 sm:gap-5 px-2 sm:px-4 lg:px-0 pb-4 lg:pb-4">
            <RightPanel task={task} onUpdate={updateTask} activities={activities} />
          </aside>
        )}
        </div>
      </div>
    </div>
  );
}
