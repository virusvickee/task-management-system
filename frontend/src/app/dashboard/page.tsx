'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
  Plus,
} from 'lucide-react';
import KanbanCol from '@/components/KanbanCol';
import FieldsDropdown from '@/components/FieldsDropdown';
import FilterDropdown, { EMPTY_FILTERS } from '@/components/FilterDropdown';
import type { TaskFilters } from '@/components/FilterDropdown';
import ListView from '@/components/ListView';
import ToolbarSearchInput, { type ToolbarSearchInputHandle } from '@/components/ToolbarSearchInput';
import { useTasks, STATUSES } from '@/hooks/useTasks';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import type { Status, Task } from '@/hooks/useTasks';

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
  if (filters.priorities.length > 0) {
    const taskPriority = task.priority || 'No Priority';
    if (!filters.priorities.includes(taskPriority)) return false;
  }
  if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;
  if (filters.members.length > 0 && task.assignee && !filters.members.includes(task.assignee)) return false;
  if (filters.labels.length > 0) {
    const taskLabels = task.tags ?? [];
    const hasLabel = filters.labels.some((l) => taskLabels.includes(l));
    if (taskLabels.length > 0 && !hasLabel) return false;
  }
  if (filters.dueDateRange) {
    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eod = new Date(sod.getTime() + 86400000 - 1);
    const eow = new Date(sod.getTime() + (7 - sod.getDay()) * 86400000 - 1);

    if (filters.dueDateRange === 'no_date'    && due !== null) return false;
    if (filters.dueDateRange === 'overdue'    && (!due || due >= sod)) return false;
    if (filters.dueDateRange === 'today'      && (!due || due < sod || due > eod)) return false;
    if (filters.dueDateRange === 'this_week'  && (!due || due < sod || due > eow)) return false;
  }
  return true;
}

export default function DashboardPage() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [view, setView]               = useState<'Board' | 'List'>('List');
  const [query, setQuery]             = useState('');
  const [filters, setFilters]         = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields]           = useState<FieldVisibility>({
    priority: true, members: true, dueDate: true,
    labels: false, status: false, reporter: false,
  });
  const searchRef = useRef<ToolbarSearchInputHandle>(null);
  const { tasksByColumn, createTask, updateTask, refetch } = useTasks();

  useEffect(() => {
    if (pathname === '/dashboard') refetch();
  }, [pathname, refetch]);

  const handleDrop = (taskId: string, status: Status) => updateTask(taskId, { status });

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

  const hasActiveFilters = q || Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== null);

  return (
    <div className="dashboard-page-root flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="dashboard-top-header">
        <div className="dashboard-top-header-inner">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="dashboard-sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} strokeWidth={1.75} />
          </button>
          <div className="dashboard-top-header-divider" aria-hidden="true" />
        </div>
      </header>

      {/* ── Title & Tools Row ── */}
      <div className="dashboard-page-shell shrink-0">
        <div className="dashboard-page-toolbar">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <h1 className="dashboard-page-title truncate">Tasks</h1>
            {hasActiveFilters && (
              <span className="dashboard-page-meta">
                {Object.values(filteredByColumn).flat().length} results
              </span>
            )}
          </div>

          {/* Right: tools */}
          <div className="dashboard-page-toolbar-actions">
          <ToolbarSearchInput
            ref={searchRef}
            value={query}
            onChange={setQuery}
            placeholder="Design Homepage"
            aria-label="Search tasks"
          />

          {/* Fields dropdown */}
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
      </div>

      {view === 'Board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-none dashboard-kanban-area">
          <div className="flex items-start dashboard-kanban-inner">
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
        <ListView tasksByColumn={filteredByColumn} onAddTask={createTask} query={q} fields={fields} />
      )}
    </div>
  );
}
