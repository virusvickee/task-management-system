'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AtSign, ArrowRight, Calendar, Check, ChevronDown, ChevronRight, Eye,
  Lock, MoreHorizontal, PanelLeft,
  PanelRight, Paperclip, Plus, Send, Settings, Share2, SmilePlus, Tag, UserPlus, X,
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';
import { apiFetch } from '@/lib/api';
import type { Task } from '@/hooks/useTasks';
import { readTaskDetail, writeTaskDetail, patchCachedTask } from '@/lib/client-cache';
import DatePickerPopover, { formatPillDate, formatTableDate } from '@/components/DatePickerPopover';
import DateBadgeDestructive from '@/components/ui/DateBadgeDestructive';
import PriorityBars from '@/components/ui/PriorityBars';
import AssignMemberPopover from '@/components/AssignMemberPopover';
import { displayStatus, PRIORITIES, STATUS_DOTS, type Priority } from '@/lib/priority';
import { avatarColor, avatarInitials, avatarSizeClass } from '@/lib/avatar';
import { validateAttachmentFiles } from '@/lib/attachments';
import { toastConfirm, toastError, toastSuccess } from '@/lib/toast';
import MobileUserMenu from '@/components/MobileUserMenu';
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
function Avatar({ name, size = 6 }: { name: string; size?: number }) {
  return (
    <span className={`${avatarSizeClass(size)} rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>
      {avatarInitials(name)}
    </span>
  );
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
  onRegisterSave,
}: {
  title: string;
  description: string;
  locked: boolean;
  editing: boolean;
  onEditingChange: (value: boolean) => void;
  onSave: (partial: { title: string; description: string }) => Promise<unknown>;
  onRegisterSave?: (save: () => Promise<void>) => void;
}) {
  const [titleDraft, setTitleDraft] = useState(title);
  const [descriptionDraft, setDescriptionDraft] = useState(description);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const cancel = useCallback(() => {
    setTitleDraft(title);
    setDescriptionDraft(description);
    onEditingChange(false);
  }, [title, description, onEditingChange]);

  const save = useCallback(async () => {
    const trimmedTitle = titleDraft.trim();
    if (!trimmedTitle) return;
    try {
      await onSave({ title: trimmedTitle, description: descriptionDraft.trim() });
      onEditingChange(false);
    } catch {
      setTitleDraft(title);
      setDescriptionDraft(description);
    }
  }, [titleDraft, descriptionDraft, title, description, onSave, onEditingChange]);

  useEffect(() => {
    if (editing) return;
    setTitleDraft(title);
    setDescriptionDraft(description);
  }, [editing, title, description]);

  useEffect(() => {
    if (!editing) return;
    const id = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [editing]);

  useEffect(() => {
    onRegisterSave?.(save);
  }, [save, onRegisterSave]);

  if (editing) {
    return (
      <div className="task-detail-header-edit flex flex-col flex-1 min-w-0 w-full gap-1.5">
        <input
          ref={titleRef}
          type="text"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') cancel();
            if (event.key === 'Enter') { event.preventDefault(); save(); }
          }}
          disabled={locked}
          aria-label="Task title"
          placeholder="Task title"
          className="task-detail-title task-detail-title-input task-page-input w-full shrink-0 bg-[var(--base-background)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="task-detail-title-inner flex flex-col flex-1 min-w-0 w-full">
      <h1 className="task-detail-title task-detail-title--readonly">{title}</h1>
      {description ? (
        <p className="task-detail-description task-detail-description--readonly">{description}</p>
      ) : null}
    </div>
  );
}

function LabelEditor({
  tags,
  onUpdate,
  disabled = false,
  align = 'start',
  variant = 'editable',
}: {
  tags: string[];
  onUpdate: (tags: string[]) => Promise<unknown>;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  variant?: 'display' | 'editable';
}) {
  const [open, setOpen] = useState(false);
  const alignClass = align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : 'justify-start';
  const toggle = async (tag: string) => {
    const next = tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag];
    try { await onUpdate(next); } catch { /* parent restores optimistic state */ }
  };

  if (variant === 'display') {
    return (
      <div className={`flex flex-wrap gap-1 ${alignClass}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="task-detail-meta-pill bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
          >
            <Tag size={11} className="text-gray-700 dark:text-gray-300 shrink-0" strokeWidth={2.5} />
            {tag}
          </span>
        ))}
      </div>
    );
  }

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
      <PopoverContent align="end" className="w-[min(11rem,calc(100vw-24px))] p-1">
        {LABELS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className="app-dropdown-item w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Tag size={13} className="text-gray-400 dark:text-gray-500" />
            <span className="flex-1">{tag}</span>
            {tags.includes(tag) && <Check size={14} className="text-gray-700 dark:text-gray-300" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function TeamPicker({ team, onUpdate, disabled = false }: { team?: string; onUpdate: (team: string) => Promise<unknown>; disabled?: boolean }) {
  return <Popover><PopoverTrigger asChild><button disabled={disabled} className={`text-[13px] ${team ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'} ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:text-gray-900 dark:hover:text-gray-100'}`}>{team || '—'}</button></PopoverTrigger><PopoverContent align="end" className="w-[min(10rem,calc(100vw-24px))] p-1">
    {TEAMS.map((option) => (
      <button
        key={option}
        onClick={() => onUpdate(option)}
        className="app-dropdown-item w-full flex items-center justify-between px-2 py-1.5 rounded text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span>{option}</span>
        {team === option && <Check size={14} className="text-gray-700 dark:text-gray-300" />}
      </button>
    ))}
  </PopoverContent></Popover>;
}

function PriorityDisplay({ value }: { value: Priority }) {
  const current = PRIORITIES.find((item) => item.label === value) || PRIORITIES[0];
  return (
    <span className={`task-subtasks-table__priority-readonly flex items-center gap-1.5 text-[13px] font-medium ${current.textColor}`}>
      <PriorityBars priority={value} size={12} />
      <span>{value === 'No Priority' ? '—' : value}</span>
    </span>
  );
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
      <DropdownMenuContent align={menuAlign} className="w-[min(11rem,calc(100vw-24px))] p-1">
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
  return <div className="relative"><button ref={btnRef} data-subtask-date={task._id} disabled={disabled} onClick={() => toggleOpen(!isOpen)} className={`task-subtasks-table__date${disabled ? ' task-subtasks-table__date--disabled' : ''}`}>{formatTableDate(date) || 'Add date'}</button>{isOpen && <DatePickerPopover anchorRef={btnRef} selectedDate={date} onSelectDate={async (value) => { await onUpdate({ dueDate: value, endDate: value }); toggleOpen(false); }} onClose={() => toggleOpen(false)} />}</div>;
}

function SubtasksSection({
  task,
  locked,
  headerEditing = false,
  onCancelHeaderEdit,
  onSubtasksChange,
}: {
  task: Task;
  locked: boolean;
  headerEditing?: boolean;
  onCancelHeaderEdit?: () => void;
  onSubtasksChange?: (subtasks: Task[]) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>((task as Task & { subtasks?: Task[] }).subtasks || []);
  const [adding, setAdding] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editingSubtaskIdRef = useRef<string | null>(null);
  const editFocusPendingRef = useRef(false);

  const syncSubtasks = useCallback((next: Task[]) => {
    setSubtasks(next);
    onSubtasksChange?.(next);
  }, [onSubtasksChange]);

  useEffect(() => {
    syncSubtasks((task as Task & { subtasks?: Task[] }).subtasks || []);
  }, [task._id]); // eslint-disable-line react-hooks/exhaustive-deps -- only reload when navigating to a different task

  useEffect(() => {
    if (!editingSubtaskId) return;
    const timer = window.setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
      editFocusPendingRef.current = false;
    }, 0);
    return () => window.clearTimeout(timer);
  }, [editingSubtaskId]);

  useEffect(() => {
    if (headerEditing) cancelEdit();
  }, [headerEditing]); // eslint-disable-line react-hooks/exhaustive-deps -- cancel subtask edit when main title edits

  const updateSubtask = async (subtaskId: string, partial: Partial<Task>) => {
    if (subtaskId === task._id || subtaskId.startsWith('tmp-')) return;
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
    toastConfirm({
      title: 'Delete subtask?',
      message: 'This subtask will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        const previous = subtasks;
        const optimistic = subtasks.filter((item) => item._id !== subtask._id);
        syncSubtasks(optimistic);
        try {
          await apiFetch(`/tasks/${subtask._id}`, { method: 'DELETE' });
          toastSuccess('Subtask deleted');
        } catch {
          syncSubtasks(previous);
          toastError('Failed to delete subtask');
        }
      },
    });
  };

  const startEdit = (subtask: Task) => {
    if (locked || subtask._id.startsWith('tmp-') || subtask._id === task._id) return;
    if (editingSubtaskIdRef.current === subtask._id) {
      void finishEdit();
      return;
    }
    onCancelHeaderEdit?.();
    editFocusPendingRef.current = true;
    editingSubtaskIdRef.current = subtask._id;
    setEditingSubtaskId(subtask._id);
    setEditingTitle(subtask.title);
  };

  const cancelEdit = () => {
    editingSubtaskIdRef.current = null;
    editFocusPendingRef.current = false;
    setEditingSubtaskId(null);
    setEditingTitle('');
  };

  const saveTitleDraft = async () => {
    const subtaskId = editingSubtaskIdRef.current;
    if (!subtaskId || subtaskId === task._id) return;
    const trimmed = editingTitle.trim();
    if (!trimmed) return;
    const previousTitle = subtasks.find((item) => item._id === subtaskId)?.title ?? '';
    if (trimmed === previousTitle) return;
    await updateSubtask(subtaskId, { title: trimmed });
  };

  const finishEdit = async () => {
    if (editFocusPendingRef.current) return;
    await saveTitleDraft();
    cancelEdit();
  };

  const saveEdit = async () => {
    await saveTitleDraft();
  };

  return (
    <div className="task-subtasks-section">
      <button type="button" onClick={() => setCollapsed((v) => !v)} className="task-subtasks-heading">
        {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
        Subtasks
      </button>
      {!collapsed && (
        <div className="task-subtasks-card">
          <div className="task-subtasks-table-scroll overflow-x-auto overscroll-x-contain scrollbar-none">
            <table className="task-subtasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Members</th>
                  <th>Due Date</th>
                  <th className="task-subtasks-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subtasks.filter((subtask) => subtask._id !== task._id).map((subtask) => {
                  const member = subtask.members?.[0] || subtask.assignee;
                  const isRowEditing = editingSubtaskId === subtask._id;
                  const dueDate = subtask.dueDate || subtask.endDate || null;
                  return (
                    <tr key={subtask._id} className={isRowEditing ? 'task-subtasks-table__row--editing' : undefined}>
                      <td className="task-subtasks-table__task">
                        {isRowEditing ? (
                          <input
                            ref={editInputRef}
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') cancelEdit();
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                void saveEdit();
                              }
                            }}
                            disabled={locked}
                            aria-label="Edit subtask title"
                            className="task-subtasks-table__task-input w-full bg-transparent outline-none"
                          />
                        ) : (
                          <span className="task-subtasks-table__task-label">{subtask.title}</span>
                        )}
                      </td>
                      <td className="task-subtasks-table__cell">
                        {isRowEditing ? (
                          <PriorityDropdown
                            value={(subtask.priority as Priority) || 'No Priority'}
                            onChange={(priority) => updateSubtask(subtask._id, { priority })}
                            disabled={locked}
                          />
                        ) : (
                          <PriorityDisplay value={(subtask.priority as Priority) || 'No Priority'} />
                        )}
                      </td>
                      <td className="task-subtasks-table__cell">
                        {isRowEditing ? (
                          <AssignMemberPopover
                            taskId={subtask._id}
                            currentMembers={subtask.members || (subtask.assignee ? [subtask.assignee] : [])}
                            onUpdate={(members) => updateSubtask(subtask._id, { members, assignee: members[0] || '' })}
                            disabled={locked}
                            trigger={member ? (
                              <button type="button" className="task-subtasks-table__member-trigger">
                                <Avatar name={member} size={7} />
                              </button>
                            ) : (
                              <button type="button" className="task-subtasks-table__member-add">
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            )}
                          />
                        ) : member ? (
                          <span className="task-subtasks-table__member-readonly">
                            <Avatar name={member} size={7} />
                          </span>
                        ) : (
                          <span className="task-subtasks-table__member-empty">—</span>
                        )}
                      </td>
                      <td className="task-subtasks-table__cell">
                        {isRowEditing ? (
                          <SubtaskDueDate task={subtask} onUpdate={(partial) => updateSubtask(subtask._id, partial)} disabled={locked} />
                        ) : (
                          <span className="task-subtasks-table__date task-subtasks-table__date--readonly">
                            {formatTableDate(dueDate) || '—'}
                          </span>
                        )}
                      </td>
                      <td className="task-subtasks-table__cell task-subtasks-table__actions-col">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="task-subtasks-table__actions-btn">
                              <MoreHorizontal size={16} strokeWidth={2.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            onCloseAutoFocus={(event) => {
                              if (editingSubtaskIdRef.current) event.preventDefault();
                            }}
                          >
                            <DropdownMenuItem
                              disabled={locked || subtask._id.startsWith('tmp-')}
                              onSelect={() => startEdit(subtask)}
                            >
                              {isRowEditing ? 'Done' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void duplicate(subtask)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void remove(subtask)} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="task-subtasks-footer">
            {adding ? (
              <input
                ref={inputRef}
                autoFocus
                placeholder="Subtask title…"
                className="task-page-input w-full bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addSubtask();
                  if (e.key === 'Escape') setAdding(false);
                }}
              />
            ) : (
              <button type="button" onClick={() => setAdding(true)} className="task-subtasks-add-btn">
                <Plus size={14} strokeWidth={2.5} />
                Add Subtasks
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(date: string) {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
}

type Comment = NonNullable<Task['comments']>[number];

function getCurrentUserName(fallback = 'Guest') {
  if (typeof window === 'undefined') return fallback;
  const user = JSON.parse(localStorage.getItem('tms-user') || 'null');
  return user?.name || fallback;
}

function CommentComposer({
  variant,
  userName,
  value,
  onChange,
  onSubmit,
  files,
  onFilesChange,
  placeholder,
  disabled = false,
}: {
  variant: 'reply' | 'primary';
  userName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  const attach = () => fileInput.current?.click();

  const onFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    const error = validateAttachmentFiles(incoming);
    if (error) {
      toastError(error);
      return;
    }
    onFilesChange(incoming);
  };

  const fileInputEl = (
    <input ref={fileInput} onChange={onFilesSelected} type="file" className="hidden" />
  );

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={attach}
        title="Attach file"
        aria-label="Attach file"
        disabled={disabled}
        className="comment-compose-card__icon-btn"
      >
        <Paperclip size={16} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={onSubmit}
        aria-label="Send"
        disabled={disabled}
        className="comment-compose-card__icon-btn"
      >
        <Send size={16} strokeWidth={1.75} />
      </button>
    </>
  );

  if (variant === 'primary') {
    return (
      <>
        <div className="comment-compose-card__inner">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit();
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="comment-compose-card__input task-page-input"
          />
          <div className="comment-compose-card__actions">
            {fileInputEl}
            {actionButtons}
          </div>
        </div>
        {files.length > 0 && (
          <div className="comment-compose-card__files flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={file.name} className="text-[11px] text-gray-500 dark:text-gray-400">
                <Paperclip size={11} className="inline" /> {file.name}
              </span>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="comment-card__composer-wrap">
      <div className="comment-card__composer">
        <div className="comment-card__composer-main">
          <Avatar name={userName} size={6} />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit();
            }}
            placeholder={placeholder}
            disabled={disabled}
            className="comment-card__composer-input task-page-input"
          />
        </div>
        <div className="comment-card__composer-actions">
          {fileInputEl}
          {actionButtons}
        </div>
      </div>
      {files.length > 0 && (
        <div className="comment-card__composer-files flex flex-wrap gap-2">
          {files.map((file) => (
            <span key={file.name} className="text-[11px] text-gray-500 dark:text-gray-400">
              <Paperclip size={11} className="inline" /> {file.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentCard({
  comment,
  currentUserName,
  onSubmitReply,
  onReaction,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  currentUserName: string;
  onSubmitReply: (comment: Comment, text: string, files: File[]) => Promise<void>;
  onReaction: (comment: Comment, emoji: string) => void;
  onEdit: (comment: Comment, text: string) => void;
  onDelete: (comment: Comment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.text);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [sendingReply, setSendingReply] = useState(false);

  const save = () => {
    if (!text.trim() || text.trim() === comment.text) {
      setEditing(false);
      return;
    }
    onEdit(comment, text.trim());
    setEditing(false);
  };

  async function handleSendReply() {
    const trimmed = replyText.trim();
    if (!trimmed && replyFiles.length === 0) return;
    setSendingReply(true);
    try {
      await onSubmitReply(comment, replyText, replyFiles);
      setReplyText('');
      setReplyFiles([]);
    } finally {
      setSendingReply(false);
    }
  }

  return (
    <div className="comment-thread-card">
      <div className="comment-thread-card__body">
        <div className="flex flex-wrap items-center gap-2">
          <Avatar name={comment.author} size={7} />
          <span className={TYPO.commentAuthor}>{comment.author}</span>
          <span className={TYPO.commentMeta}>{formatRelativeTime(comment.createdAt)}</span>
          <div className="ml-auto flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Popover>
              <PopoverTrigger asChild>
                <button title="Add reaction" className="rounded p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <SmilePlus size={18} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[min(12rem,calc(100vw-24px))] p-1">
                <div className="flex gap-1">
                  {['👍', '🎉', '❤️', '😂'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(comment, emoji)}
                      className="app-dropdown-item rounded p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button title="More actions" className="rounded p-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <MoreHorizontal size={17} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(comment.text)}>Copy comment</DropdownMenuItem>
                {comment._id && (
                  <DropdownMenuItem onClick={() => { setText(comment.text); setEditing(true); }}>
                    Edit comment
                  </DropdownMenuItem>
                )}
                {comment._id && (
                  <DropdownMenuItem onClick={() => onDelete(comment)} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">
                    Delete comment
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {editing ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') save();
                if (event.key === 'Escape') setEditing(false);
              }}
              className="task-page-input min-w-0 flex-1 rounded border border-gray-300 bg-transparent px-2 py-1 text-sm outline-none focus:border-gray-500 dark:border-gray-600 dark:focus:border-gray-400"
            />
            <button onClick={save} aria-label="Save comment" className="rounded p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Check size={16} />
            </button>
            <button onClick={() => setEditing(false)} aria-label="Cancel edit" className="rounded p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X size={16} />
            </button>
          </div>
        ) : (
          <p className="comment-thread-card__text">{comment.text}</p>
        )}

        {comment.attachments?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {comment.attachments.map((attachment) => (
              <a key={attachment.name} href={attachment.dataUrl} download={attachment.name} className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-[12px] text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                <Paperclip size={12} />
                {attachment.name}
              </a>
            ))}
          </div>
        ) : null}

        {comment.reactions?.length ? (
          <div className="mt-3 flex gap-1">
            {comment.reactions.map((emoji) => (
              <span key={emoji} className="rounded-full bg-gray-100 px-2 py-0.5 text-[12px] dark:bg-gray-800">{emoji}</span>
            ))}
          </div>
        ) : null}
      </div>

      <CommentComposer
        variant="reply"
        userName={currentUserName}
        value={replyText}
        onChange={setReplyText}
        onSubmit={handleSendReply}
        files={replyFiles}
        onFilesChange={setReplyFiles}
        placeholder="Leave a reply..."
        disabled={sendingReply}
      />
    </div>
  );
}

function CommentsSection({ taskId, fallbackAuthor }: { taskId: string; fallbackAuthor: string }) {
  const [comments, setComments] = useState<NonNullable<Task['comments']>>([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentFiles, setNewCommentFiles] = useState<File[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [currentUserName, setCurrentUserName] = useState(fallbackAuthor);

  useEffect(() => {
    setCurrentUserName(getCurrentUserName(fallbackAuthor));
  }, [fallbackAuthor]);

  useEffect(() => {
    apiFetch(`/tasks/${taskId}`)
      .then((item) => setComments(item.comments || []))
      .catch(console.error);
  }, [taskId]);

  const readAttachment = (file: File) =>
    new Promise<{ name: string; dataUrl: string; type: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: String(reader.result), type: file.type || 'application/octet-stream' });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const submitComment = async (text: string, files: File[]) => {
    const attachmentError = validateAttachmentFiles(files);
    if (attachmentError) {
      toastError(attachmentError);
      throw new Error(attachmentError);
    }

    const trimmed = text.trim();
    const body = trimmed || (files.length ? `Attached ${files.map((file) => file.name).join(', ')}` : '');
    if (!body) return;

    const currentUser = JSON.parse(localStorage.getItem('tms-user') || 'null');
    const previous = comments;
    const optimistic = {
      author: currentUser?.name || fallbackAuthor,
      text: body,
      createdAt: new Date().toISOString(),
      attachments: files.map((file) => ({ name: file.name, dataUrl: '', type: file.type })),
    };

    setComments((items) => [...items, optimistic]);

    try {
      const attachments = await Promise.all(files.map(readAttachment));
      const saved = await apiFetch(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: body, attachments }),
      });
      setComments(saved.comments || previous);
    } catch (err) {
      setComments(previous);
      const message = err instanceof Error ? err.message : 'Failed to save comment';
      toastError(message);
      throw err;
    }
  };

  const submitReply = async (comment: Comment, text: string, files: File[]) => {
    const trimmed = text.trim();
    let body = trimmed || (files.length ? `Attached ${files.map((file) => file.name).join(', ')}` : '');
    if (!body) return;
    if (!body.startsWith('@')) {
      body = `@${comment.author} ${body}`;
    }
    await submitComment(body, files);
  };

  const applyServerComments = async (request: () => Promise<Task>, previous: Comment[]) => {
    try {
      const saved = await request();
      setComments(saved.comments || previous);
    } catch {
      setComments(previous);
    }
  };

  const addReaction = (comment: Comment, emoji: string) => {
    if (!comment._id) return;
    const previous = comments;
    setComments((items) =>
      items.map((item) =>
        item._id === comment._id
          ? { ...item, reactions: Array.from(new Set([...(item.reactions || []), emoji])) }
          : item,
      ),
    );
    applyServerComments(
      () => apiFetch(`/tasks/${taskId}/comments/${comment._id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
      previous,
    );
  };

  const editComment = (comment: Comment, text: string) => {
    if (!comment._id) return;
    const previous = comments;
    setComments((items) => items.map((item) => (item._id === comment._id ? { ...item, text } : item)));
    applyServerComments(
      () => apiFetch(`/tasks/${taskId}/comments/${comment._id}`, { method: 'PATCH', body: JSON.stringify({ text }) }),
      previous,
    );
  };

  const deleteComment = (comment: Comment) => {
    if (!comment._id) return;
    toastConfirm({
      title: 'Delete comment?',
      message: 'This comment will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        const previous = comments;
        setComments((items) => items.filter((item) => item._id !== comment._id));
        applyServerComments(
          () => apiFetch(`/tasks/${taskId}/comments/${comment._id}`, { method: 'DELETE' }),
          previous,
        );
      },
    });
  };

  const handleNewComment = async () => {
    setSendingComment(true);
    try {
      await submitComment(newComment, newCommentFiles);
      setNewComment('');
      setNewCommentFiles([]);
    } catch {
      // submitComment already shows toast
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <section className="task-comments-section">
      {comments.map((comment, index) => (
        <CommentCard
          key={comment._id || `${comment.createdAt}-${index}`}
          comment={comment}
          currentUserName={currentUserName}
          onSubmitReply={submitReply}
          onReaction={addReaction}
          onEdit={editComment}
          onDelete={deleteComment}
        />
      ))}

      <div className={`comment-compose-card${newCommentFiles.length > 0 ? ' comment-compose-card--has-files' : ''}`}>
        <CommentComposer
          variant="primary"
          userName={currentUserName}
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleNewComment}
          files={newCommentFiles}
          onFilesChange={setNewCommentFiles}
          placeholder="Add a comment..."
          disabled={sendingComment}
        />
      </div>
    </section>
  );
}

function FieldPicker({ fields, onChange, trigger }: { fields: Record<DetailField, boolean>; onChange: (fields: Record<DetailField, boolean>) => void; trigger: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-[min(12rem,calc(100vw-24px))] p-1">
        <p className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">Visible fields</p>
        {DETAIL_FIELDS.map((field) => (
          <button
            key={field}
            onClick={() => onChange({ ...fields, [field]: !fields[field] })}
            className="app-dropdown-item w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span>{field}</span>
            {fields[field] && <Check size={14} className="text-gray-700 dark:text-gray-300" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function UpdatesSection({ entries }: { entries: ActivityEntry[] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`updates-card w-full flex flex-col gap-3 bg-[var(--base-background)] border border-[color:var(--base-border)] overflow-hidden${open ? ' min-h-[154px]' : ''}`}>
      <button type="button" onClick={() => setOpen((value) => !value)} className={`flex w-full shrink-0 items-center gap-2 text-left font-bold text-sm text-gray-900 dark:text-gray-100`}>
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
  const detailsTrigger = (
    <button aria-label="Manage detail fields" className="details-card-icon-btn rounded p-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800">
      <Plus size={14} strokeWidth={2.5} />
    </button>
  );
  const settingsTrigger = (
    <button aria-label="Details settings" className="details-card-icon-btn rounded p-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800">
      <Settings size={14} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className="task-detail-aside-inner">
      <div data-state={detailsOpen ? 'open' : 'closed'} className="details-card overflow-visible bg-[var(--base-background)]">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-gray-100">
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
    <div className="detail-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-x-3 py-2.5">
      <span className={`${TYPO.sidebarFieldLabel} shrink-0`}>{label}</span>
      <div className="flex justify-start sm:justify-end items-center flex-wrap gap-1 min-w-0 w-full sm:w-auto">{children}</div>
    </div>
  );
}

function mergeSavedTask(current: Task, saved: Partial<Task>, partial: Partial<Task>): Task {
  return {
    ...current,
    ...saved,
    title: saved.title ?? partial.title ?? current.title,
    description: saved.description ?? partial.description ?? current.description,
    tags: Array.isArray(saved.tags) ? saved.tags : (partial.tags ?? current.tags ?? []),
    members: Array.isArray(saved.members) ? saved.members : (partial.members ?? current.members ?? []),
    resources: Array.isArray(saved.resources) ? saved.resources : (partial.resources ?? current.resources ?? []),
    subtasks: current.subtasks,
  };
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [task, setTask] = useState<Task | null>(() => (id ? readTaskDetail(id) : null));
  const [rightPanel, setRightPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(() => !(id && readTaskDetail(id)));
  const [copied, setCopied] = useState(false);
  const [headerEditing, setHeaderEditing] = useState(false);
  const headerSaveRef = useRef<(() => Promise<void>) | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const registerHeaderSave = useCallback((save: () => Promise<void>) => {
    headerSaveRef.current = save;
  }, []);
  const toggleHeaderEdit = useCallback(() => {
    if (headerEditing) {
      void headerSaveRef.current?.();
      return;
    }
    setHeaderEditing(true);
  }, [headerEditing]);
  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const showDetailsPanel = isMobile || rightPanel;
  useEffect(() => {
    if (!id) return;

    const cached = readTaskDetail(id);
    if (cached) {
      setTask(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;
    apiFetch(`/tasks/${id}`)
      .then((data: Task) => {
        if (cancelled) return;
        writeTaskDetail(data);
        setTask(data);
      })
      .catch(() => {
        if (!cancelled) router.replace('/dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);
  const updateTask = useCallback(async (partial: Partial<Task>) => {
    let snapshot: Task | null = null;

    setTask((current) => {
      if (!current) return current;
      snapshot = current;
      return { ...current, ...partial };
    });

    if (!snapshot) return;
    const previous = snapshot as Task;
    const taskId = previous._id;
    patchCachedTask(taskId, partial);

    if (partial.priority && partial.priority !== previous.priority) {
      const from = (previous.priority as Priority) || 'No Priority';
      const to = partial.priority as Priority;
      setActivities((items) => [{
        id: `priority-${Date.now()}`,
        type: 'priority',
        priority: to,
        text: `changed priority from ${from} to ${to}`,
      }, ...items]);
    }

    try {
      const saved = await apiFetch(`/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(partial) });
      setTask((current) => {
        if (!current) return current;
        const merged = mergeSavedTask(current, saved, partial);
        writeTaskDetail(merged);
        return merged;
      });
      return saved;
    } catch (error) {
      setTask(previous);
      throw error;
    }
  }, []);
  const share = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* clipboard availability is browser dependent */ } };
  const duplicate = async () => { if (!task) return; const copy = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify({ title: `${task.title} (copy)`, status: task.status, projectId: task.projectId, priority: task.priority, members: task.members, tags: task.tags, team: task.team }) }); router.push(`/dashboard/tasks/${copy._id}`); };
  const remove = () => {
    if (!task) return;
    toastConfirm({
      title: 'Delete task?',
      message: 'This task will be permanently removed.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await apiFetch(`/tasks/${task._id}`, { method: 'DELETE' });
        toastSuccess('Task deleted');
        router.push('/dashboard');
      },
    });
  };
  if (loading) return <div className="flex-1 flex items-center justify-center bg-[var(--background)] text-gray-400 dark:text-gray-500 text-sm">Loading…</div>;
  if (!task) return <div className="flex-1 flex items-center justify-center bg-[var(--background)] text-gray-400 dark:text-gray-500 text-sm">Task not found</div>;

  const memberCount = task.members?.length ?? (task.assignee ? 1 : 0);
  const roleLabel = task.team || task.assignee || 'Designer';
  const roleAvatar = task.assignee || task.team || 'Designer';
  const dueLabel = formatPillDate(task.dueDate || task.endDate || null);

  return (
    <div className="task-detail-page flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="dashboard-top-header hidden lg:block">
        <div className="dashboard-top-header-inner">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            className="dashboard-sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} strokeWidth={2.5} className="dashboard-toolbar-icon" />
          </button>
          <div className="dashboard-top-header-divider" aria-hidden="true" />
        </div>
      </header>

      <nav className="task-detail-mobile-nav lg:hidden shrink-0" aria-label="Task navigation">
        <Link href="/dashboard" className="task-detail-mobile-back">
          <ArrowLeft size={16} strokeWidth={2} />
          <span>Tasks</span>
        </Link>
        <MobileUserMenu />
      </nav>

      <div className="task-detail-body flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="task-detail-title-bar shrink-0">
          <div className="task-detail-frame">
            <div className="task-detail-title-row">
              <div className="task-detail-title-block">
                <TaskHeaderSection
                  title={task.title}
                  description={task.description || ''}
                  locked={Boolean(task.locked)}
                  editing={headerEditing}
                  onEditingChange={setHeaderEditing}
                  onSave={async ({ title, description }) => updateTask({ title, description })}
                  onRegisterSave={registerHeaderSave}
                />
              </div>
              <div className="task-detail-toolbar">
                <button
                  type="button"
                  onClick={() => updateTask({ locked: !task.locked })}
                  className={`dashboard-toolbar-icon-btn${task.locked ? ' dashboard-toolbar-icon-btn--locked' : ''}`}
                  aria-label="Lock task"
                  aria-pressed={Boolean(task.locked)}
                >
                  <Lock size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
                </button>
                <span className="task-detail-viewer-badge" title="Viewers">
                  <Eye size={14} strokeWidth={1.75} />
                  <span>{memberCount > 0 ? memberCount : 1}</span>
                </span>
                <button type="button" onClick={share} className="dashboard-toolbar-icon-btn" aria-label="Share task">
                  <Share2 size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
                </button>
                {copied && <span className="absolute top-10 right-0 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">Link copied</span>}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="dashboard-toolbar-icon-btn" aria-label="More actions">
                      <MoreHorizontal size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={Boolean(task.locked)} onSelect={toggleHeaderEdit}>
                      {headerEditing ? 'Done' : 'Edit'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={duplicate}>Duplicate task</DropdownMenuItem>
                    <DropdownMenuItem onClick={remove} className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400">Delete task</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  onClick={() => setRightPanel((v) => !v)}
                  className={`task-detail-toolbar__panel-toggle dashboard-toolbar-icon-btn${rightPanel ? ' dashboard-toolbar-icon-btn--active' : ''}`}
                  aria-label="Toggle details panel"
                >
                  <PanelRight size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="task-detail-body-scroll flex-1 min-h-0 overflow-hidden">
          <div className="task-detail-frame task-detail-frame--scroll h-full min-h-0">
            <div className="task-detail-columns">
              <main className="task-detail-main">
              <div className="task-detail-meta">
                <div className="task-detail-meta-row">
                  <span className="task-detail-meta-label">Properties</span>
                  <div className="task-detail-meta-value flex items-center gap-2 flex-wrap">
                    <div className="task-detail-properties-role">
                      <span className="task-detail-properties-role__avatar" aria-hidden="true">
                        {avatarInitials(roleAvatar).slice(0, 1)}
                      </span>
                      <span className="task-detail-properties-role__label">{roleLabel}</span>
                    </div>
                    {dueLabel && <DateBadgeDestructive badgeText={dueLabel} />}
                  </div>
                </div>
                <div className="task-detail-meta-row task-detail-meta-row--labels">
                  <span className="task-detail-meta-label">Labels</span>
                  <div className="task-detail-meta-value">
                    <LabelEditor tags={task.tags || []} onUpdate={(tags) => updateTask({ tags })} disabled={Boolean(task.locked)} variant="display" />
                  </div>
                </div>
                <div className="task-detail-meta-row">
                  <span className="task-detail-meta-label">Resources</span>
                  <div className="task-detail-meta-value flex flex-col gap-1">
                    {(task.resources || []).map((resource) => (
                      <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer" className="text-[13px] text-gray-700 dark:text-gray-300 hover:underline">
                        {resource.title}
                      </a>
                    ))}
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
                      className="task-detail-meta-add-link flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-300 text-left bg-transparent border-none p-0 cursor-pointer"
                    >
                      <AtSign size={13} />
                      Add document or link…
                    </button>
                  </div>
                </div>
              </div>

              <div className="task-detail-main-body">
                <SubtasksSection
                  task={task}
                  locked={Boolean(task.locked)}
                  headerEditing={headerEditing}
                  onCancelHeaderEdit={() => setHeaderEditing(false)}
                  onSubtasksChange={(subtasks) => setTask((current) => current ? { ...current, subtasks } as Task & { subtasks: Task[] } : current)}
                />
                <CommentsSection taskId={task._id} fallbackAuthor={task.reporterName || 'Guest'} />
              </div>
            </main>

            {showDetailsPanel && (
              <aside className="task-detail-aside">
                <RightPanel task={task} onUpdate={updateTask} activities={activities} />
              </aside>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
