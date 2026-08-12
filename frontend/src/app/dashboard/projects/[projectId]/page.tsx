'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, ChevronRight, PanelLeft } from 'lucide-react';
import KanbanCol from '@/components/KanbanCol';
import FieldsDropdown from '@/components/FieldsDropdown';
import FilterDropdown, { EMPTY_FILTERS } from '@/components/FilterDropdown';
import type { TaskFilters } from '@/components/FilterDropdown';
import ListView from '@/components/ListView';
import ToolbarSearchInput, { type ToolbarSearchInputHandle } from '@/components/ToolbarSearchInput';
import { useTasks, STATUSES } from '@/hooks/useTasks';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import type { Status, Task } from '@/hooks/useTasks';
import { apiFetch, guestLogin } from '@/lib/api';
import { useSidebar } from '@/context/sidebar-context';

export type FieldVisibility = {
  priority: boolean;
  members:  boolean;
  dueDate:  boolean;
  labels:   boolean;
  status:   boolean;
  reporter: boolean;
};

function matchesFilters(task: Task, filters: TaskFilters): boolean {
  if (filters.priorities?.length > 0) {
    const taskPriority = task.priority || 'No Priority';
    if (!filters.priorities.includes(taskPriority)) return false;
  }
  if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;
  if (filters.members.length > 0 && task.assignee && !filters.members.includes(task.assignee)) return false;
  if (filters.labels.length > 0) {
    const taskLabels = task.tags ?? [];
    if (taskLabels.length > 0 && !filters.labels.some((l) => taskLabels.includes(l))) return false;
  }
  if (filters.dueDateRange) {
    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eod = new Date(sod.getTime() + 86400000 - 1);
    const eow = new Date(sod.getTime() + (7 - sod.getDay()) * 86400000 - 1);
    if (filters.dueDateRange === 'no_date'   && due !== null) return false;
    if (filters.dueDateRange === 'overdue'   && (!due || due >= sod)) return false;
    if (filters.dueDateRange === 'today'     && (!due || due < sod || due > eod)) return false;
    if (filters.dueDateRange === 'this_week' && (!due || due < sod || due > eow)) return false;
  }
  return true;
}

export default function ProjectTasksPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [projectName, setProjectName] = useState<string>('');
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const [view, setView]             = useState<'Board' | 'List'>('List');
  const [query, setQuery]           = useState('');
  const [filters, setFilters]       = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields]         = useState<FieldVisibility>({
    priority: true,
    members: true,
    dueDate: true,
    labels: false,
    status: false,
    reporter: false,
  });
  const searchRef = useRef<ToolbarSearchInputHandle>(null);
  const { tasksByColumn, createTask, updateTask } = useTasks(projectId);

  const handleDrop = (taskId: string, status: Status) => updateTask(taskId, { status });

  useEffect(() => {
    async function loadProject() {
      if (!localStorage.getItem('tms-token')) await guestLogin();
      try {
        const p = await apiFetch(`/projects/${projectId}`);
        setProjectName(p.name);
      } catch {
        setProjectName(projectId ?? 'Project');
      }
    }
    loadProject();
  }, [projectId]);

  useSearchShortcut(() => searchRef.current?.open());

  const q = query.toLowerCase();

  const filteredByColumn = Object.fromEntries(
    STATUSES.map((s) => [
      s,
      tasksByColumn[s].filter((t) => {
        const matchesQuery = !q || t.title.toLowerCase().includes(q);
        const matchesFilt  = matchesFilters(t, filters);
        return matchesQuery && matchesFilt;
      }),
    ]),
  ) as Record<Status, Task[]>;

  const hasActiveFilters = q || Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null
  );
  const totalResults = Object.values(filteredByColumn).flat().length;

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[var(--background)] text-[var(--foreground)] dashboard-page-root">
      {/* ── Top header: toggle + breadcrumb (Figma) ── */}
      <header className="dashboard-top-header">
        <div className="dashboard-top-header-inner">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="dashboard-sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} strokeWidth={1.75} />
          </button>
          <div className="dashboard-top-header-divider" aria-hidden="true" />
          <nav className="dashboard-top-header-breadcrumb" aria-label="Breadcrumb">
            <Link href="/dashboard/projects">Projects</Link>
            <ChevronRight size={12} className="dashboard-top-header-breadcrumb-sep" aria-hidden="true" />
            <span className="dashboard-top-header-breadcrumb-current">
              {projectName || '…'}
            </span>
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto bg-[var(--background)] flex flex-col min-h-0">
        <div className="dashboard-page-shell dashboard-page-content">
          <div className="dashboard-page-toolbar shrink-0">
            <div className="flex items-center gap-2 min-w-0 min-h-8">
              <h1 className="dashboard-page-title">Tasks</h1>
              {hasActiveFilters && (
                <span className="dashboard-page-meta">
                  {totalResults} results
                </span>
              )}
            </div>
            <div className="dashboard-page-toolbar-actions">
              <ToolbarSearchInput
                ref={searchRef}
                value={query}
                onChange={setQuery}
                placeholder="Design Homepage"
                aria-label="Search tasks"
              />
              <FieldsDropdown
                view={view}
                onViewChange={setView}
                fields={fields}
                onFieldsChange={(f) => setFields(f as FieldVisibility)}
              />
              <FilterDropdown filters={filters} onFiltersChange={setFilters} />
              <button
                type="button"
                onClick={() => createTask('New Task', 'To Do')}
                className="dashboard-toolbar-add-task-btn"
              >
                <Plus size={14} strokeWidth={2} className="dashboard-toolbar-icon shrink-0" />
                <span className="dashboard-toolbar-add-task-label">Add Task</span>
              </button>
            </div>
          </div>

          {/* Board / List */}
          {view === 'Board' ? (
            <div className="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll scrollbar-none dashboard-kanban-area min-h-0">
              <div className="flex h-full items-start dashboard-kanban-inner">
                {STATUSES.filter((s) => !hasActiveFilters || filteredByColumn[s].length > 0).map((status) => (
                  <KanbanCol
                    key={status}
                    title={status}
                    tasks={filteredByColumn[status]}
                    onDrop={handleDrop}
                    onAddTask={createTask}
                    fields={fields}
                  />
                ))}
              </div>
            </div>
          ) : (
            <ListView
              tasksByColumn={filteredByColumn}
              onAddTask={createTask}
              query={q}
              fields={fields}
              compact
            />
          )}
        </div>
      </div>
    </div>
  );
}
