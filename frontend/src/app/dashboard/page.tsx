'use client';

import { useRef, useState } from 'react';
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
import { useTaskView } from '@/hooks/useTaskView';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import type { Status, Task } from '@/hooks/useTasks';

import MobileUserMenu from '@/components/MobileUserMenu';
import { useSidebar } from '@/context/sidebar-context';
import { matchesTaskFilters } from '@/lib/task-filters';

export type FieldVisibility = {
  priority: boolean;
  members:  boolean;
  dueDate:  boolean;
  labels:   boolean;
  status:   boolean;
  reporter: boolean;
};

export default function DashboardPage() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { view, setView } = useTaskView();
  const [query, setQuery]             = useState('');
  const [filters, setFilters]         = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields]           = useState<FieldVisibility>({
    priority: true, members: true, dueDate: true,
    labels: false, status: false, reporter: false,
  });
  const searchRef = useRef<ToolbarSearchInputHandle>(null);
  const {
    tasksByColumn,
    createTask,
    updateTask,
    removeTask,
    duplicateTask,
    refetch,
    loading,
    error,
  } = useTasks();

  const handleDrop = (taskId: string, status: Status) => updateTask(taskId, { status });

  useSearchShortcut(() => searchRef.current?.open());

  const q = query.toLowerCase();

  const filteredByColumn = Object.fromEntries(
    STATUSES.map((s) => [
      s,
      tasksByColumn[s].filter((t) => {
        const matchesQuery = !q || t.title.toLowerCase().includes(q);
        const matchesFilt  = matchesTaskFilters(t, filters);
        return matchesQuery && matchesFilt;
      }),
    ]),
  ) as Record<Status, Task[]>;

  const hasActiveFilters = q || Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== null);

  return (
    <div className="dashboard-page-root flex flex-col flex-1 min-w-0 min-h-0">
      <header className="dashboard-top-header hidden lg:block">
        <div className="dashboard-top-header-inner">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="dashboard-sidebar-toggle-btn"
            aria-label="Toggle sidebar"
          >
            <PanelLeft size={16} strokeWidth={2.5} />
          </button>
          <div className="dashboard-top-header-divider" aria-hidden="true" />
        </div>
      </header>

      {/* ── Toolbar (mobile: tools + avatar) / desktop: title + tools ── */}
      <div className="dashboard-page-shell dashboard-page-shell--sticky shrink-0">
        <div className="dashboard-page-toolbar">
          <div className="dashboard-page-toolbar-title hidden lg:flex items-center gap-2 min-w-0 shrink-0">
            <h1 className="dashboard-page-title truncate">Tasks</h1>
            {hasActiveFilters && (
              <span className="dashboard-page-meta">
                {Object.values(filteredByColumn).flat().length} results
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

          <MobileUserMenu className="dashboard-page-toolbar-avatar" />
        </div>
      </div>

      <div className="dashboard-page-heading lg:hidden shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="dashboard-page-title truncate">Tasks</h1>
          {hasActiveFilters && (
            <span className="dashboard-page-meta">
              {Object.values(filteredByColumn).flat().length} results
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--base-muted-foreground)]">
          Loading tasks…
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button type="button" onClick={() => refetch()} className="underline">
            Retry
          </button>
        </div>
      ) : view === 'Board' ? (
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
                onDeleteTask={removeTask}
                onDuplicateTask={duplicateTask}
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
          onDeleteTask={removeTask}
          onDuplicateTask={duplicateTask}
          onMembersChange={refetch}
        />
      )}
    </div>
  );
}
