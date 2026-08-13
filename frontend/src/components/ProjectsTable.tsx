'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, MoreHorizontal, Plus } from 'lucide-react';
import DatePickerPopover, { formatTableDate } from '@/components/DatePickerPopover';
import PriorityBars from '@/components/ui/PriorityBars';
import { ALL_MEMBERS } from '@/components/AssignMemberPopover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Project } from '@/hooks/useProjects';
import { PRIORITIES, type Priority } from '@/lib/priority';
import { toastConfirm, toastSuccess } from '@/lib/toast';

function leadInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

const LEAD_AVATAR_COLORS = [
  'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500',
];

function leadAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return LEAD_AVATAR_COLORS[h % LEAD_AVATAR_COLORS.length];
}

function LeadMenuAvatar({ name }: { name: string }) {
  return (
    <span className={`w-5 h-5 rounded-full ${leadAvatarColor(name)} flex items-center justify-center text-white text-[9px] font-semibold shrink-0`}>
      {leadInitials(name)}
    </span>
  );
}

function priorityLabel(value: Priority) {
  if (value === 'No Priority') return '—';
  return value;
}

function ProjectPriorityCell({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
}) {
  const current = PRIORITIES.find((p) => p.label === value) ?? PRIORITIES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`projects-table-priority-btn ${current.textColor}`}
          onClick={(e) => e.stopPropagation()}
        >
          <PriorityBars priority={value} size={14} />
          <span>{priorityLabel(value)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="projects-table-col-menu">
        <p className="projects-table-menu-label">Priority</p>
        {PRIORITIES.map((option) => (
          <DropdownMenuItem
            key={option.label}
            onClick={(e) => { e.stopPropagation(); onChange(option.label); }}
            className="flex items-center gap-2"
          >
            <PriorityBars priority={option.label} size={12} />
            <span className={`flex-1 ${option.textColor}`}>
              {option.label === 'No Priority' ? 'No Priority' : priorityLabel(option.label)}
            </span>
            {option.label === value && <Check size={12} className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectDueDateCell({
  dueDate,
  onChange,
}: {
  dueDate?: string;
  onChange: (date: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const formatted = formatTableDate(dueDate);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="projects-table-due-btn"
      >
        {formatted ?? <span className="projects-table-due-empty">—</span>}
      </button>
      {open && (
        <DatePickerPopover
          anchorRef={btnRef}
          selectedDate={dueDate ?? null}
          onSelectDate={(date) => { onChange(date); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function ProjectLeadCell({
  lead,
  onChange,
}: {
  lead?: string;
  onChange: (lead: string | null) => void;
}) {
  const selected = lead?.trim() || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="projects-table-lead-btn"
          aria-label={selected ? `Lead: ${selected}` : 'Assign lead'}
          onClick={(e) => e.stopPropagation()}
        >
          {selected ? (
            <span className="projects-table-lead-initials">{leadInitials(selected)}</span>
          ) : (
            <span className="projects-table-lead-add">
              <Plus size={12} strokeWidth={1.75} />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="projects-table-col-menu" onClick={(e) => e.stopPropagation()}>
        <p className="projects-table-menu-label">Lead</p>
        {ALL_MEMBERS.map((member) => (
          <DropdownMenuItem
            key={member}
            onClick={(e) => {
              e.stopPropagation();
              onChange(member);
            }}
            className="flex items-center gap-2"
          >
            <LeadMenuAvatar name={member} />
            <span className="flex-1 text-[13px]">{member}</span>
            {selected === member && <Check size={12} className="ml-auto shrink-0" />}
          </DropdownMenuItem>
        ))}
        {selected && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            Unassigned
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type ProjectFieldVisibility = {
  priority: boolean;
  members: boolean;
  dueDate: boolean;
};

interface Props {
  projects: Project[];
  loading?: boolean;
  fields: ProjectFieldVisibility;
  onUpdate: (id: string, partial: Partial<Project>) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string) => void;
}

export default function ProjectsTable({
  projects,
  loading = false,
  fields,
  onUpdate,
  onDelete,
  onCreate,
}: Props) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  function startAdding() {
    setAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 0);
  }

  function commitAdd() {
    const name = newName.trim();
    if (name) onCreate(name);
    setNewName('');
    setAdding(false);
  }

  function startRename(project: Project) {
    setRenamingId(project._id);
    setRenameVal(project.name);
    setTimeout(() => renameRef.current?.focus(), 0);
  }

  function commitRename(id: string) {
    const name = renameVal.trim();
    if (name) onUpdate(id, { name });
    setRenamingId(null);
    setRenameVal('');
  }

  function handleDelete(id: string, name: string) {
    if (id.startsWith('tmp-')) return;
    toastConfirm({
      title: 'Delete project?',
      message: `"${name}" will be permanently removed.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        await onDelete(id);
        toastSuccess('Project deleted');
      },
    });
  }

  const colCount = 2
    + (fields.priority ? 1 : 0)
    + (fields.members ? 1 : 0)
    + (fields.dueDate ? 1 : 0);

  return (
    <div className="dashboard-projects-table-wrap">
      <div className="w-full dashboard-projects-table-scroll">
        <table className="dashboard-projects-table">
          <colgroup>
            <col style={{ width: '469px' }} />
            {fields.priority && <col style={{ width: '120.75px' }} />}
            {fields.members && <col style={{ width: '120.75px' }} />}
            {fields.dueDate && <col style={{ width: '120.75px' }} />}
            <col style={{ width: '72px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="dashboard-projects-table-col-projects">Projects</th>
              {fields.priority && (
                <th className="dashboard-projects-table-col-fixed">Priority</th>
              )}
              {fields.members && (
                <th className="dashboard-projects-table-col-fixed">Lead</th>
              )}
              {fields.dueDate && (
                <th className="dashboard-projects-table-col-fixed">Due Date</th>
              )}
              <th className="text-right w-[72px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && projects.length === 0 && (
              <tr>
                <td colSpan={colCount}>
                  <div className="projects-table-skeleton" />
                </td>
              </tr>
            )}
            {!loading && projects.map((project) => {
              const isRenaming = renamingId === project._id;
              const projectHref = `/dashboard/projects/${project._id}`;
              return (
                <tr
                  key={project._id}
                  className="cursor-pointer"
                  onMouseEnter={() => router.prefetch(projectHref)}
                  onClick={() => !isRenaming && router.push(projectHref)}
                >
                  <td className="dashboard-projects-table-col-projects" onClick={(e) => isRenaming && e.stopPropagation()}>
                    {isRenaming ? (
                      <input
                        ref={renameRef}
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(project._id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onBlur={() => commitRename(project._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="projects-table-input w-full max-w-[240px]"
                      />
                    ) : (
                      <Link
                        href={`/dashboard/projects/${project._id}`}
                        className="projects-table-name hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {project.name}
                      </Link>
                    )}
                  </td>
                  {fields.priority && (
                    <td className="dashboard-projects-table-col-fixed" onClick={(e) => e.stopPropagation()}>
                      <ProjectPriorityCell
                        value={(project.priority as Priority) || 'No Priority'}
                        onChange={(priority) => onUpdate(project._id, { priority })}
                      />
                    </td>
                  )}
                  {fields.members && (
                    <td className="dashboard-projects-table-col-fixed" onClick={(e) => e.stopPropagation()}>
                      <ProjectLeadCell
                        lead={project.lead}
                        onChange={(lead) => onUpdate(project._id, { lead: lead || '' })}
                      />
                    </td>
                  )}
                  {fields.dueDate && (
                    <td className="dashboard-projects-table-col-fixed" onClick={(e) => e.stopPropagation()}>
                      <ProjectDueDateCell
                        dueDate={project.dueDate}
                        onChange={(dueDate) => onUpdate(project._id, { dueDate: dueDate ?? undefined })}
                      />
                    </td>
                  )}
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="projects-table-actions-btn"
                          aria-label="Project actions"
                        >
                          <MoreHorizontal size={16} strokeWidth={1.75} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project._id}`)}>
                          Open tasks
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startRename(project)}>
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(project._id, project.name)}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="dashboard-projects-table-footer">
        {adding ? (
          <input
            ref={addInputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd();
              if (e.key === 'Escape') { setNewName(''); setAdding(false); }
            }}
            onBlur={commitAdd}
            placeholder="Project name…"
            className="projects-table-footer-input"
          />
        ) : (
          <button
            type="button"
            onClick={startAdding}
            className="projects-table-add-btn"
          >
            <Plus size={13} />
            Add Projects
          </button>
        )}
      </div>
    </div>
  );
}
