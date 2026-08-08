'use client';

import { useEffect, useRef, useState } from 'react';
import {
  PanelLeftClose, PanelLeftOpen,
  Search, Filter, Plus,
} from 'lucide-react';
import KanbanCol from '@/components/KanbanCol';
import FieldsDropdown from '@/components/FieldsDropdown';
import ListView from '@/components/ListView';
import { useTasks, STATUSES } from '@/hooks/useTasks';
import type { Status, Task } from '@/hooks/useTasks';
import { EMPTY_FILTERS } from '@/components/FieldsDropdown';
import type { TaskFilters } from '@/components/FieldsDropdown';

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
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [view, setView]               = useState<'Board' | 'List'>('Board');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [query, setQuery]             = useState('');
  const [filters, setFilters]         = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields]           = useState<FieldVisibility>({
    priority: true, members: true, dueDate: true,
    labels: true, status: true, reporter: true,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const { tasksByColumn, createTask, updateTask } = useTasks();

  const handleDrop = (taskId: string, status: Status) => updateTask(taskId, { status });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function openSearch()  { setSearchOpen(true);  setTimeout(() => searchRef.current?.focus(), 0); }
  function closeSearch() { setSearchOpen(false);  setQuery(''); }

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
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Toggle sidebar">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
          {hasActiveFilters && (
            <span className="text-[12px] text-gray-400 dark:text-gray-500">
              {Object.values(filteredByColumn).flat().length} results
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 px-3 py-1.5 w-[300px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                onBlur={closeSearch}
                placeholder="Search tasks..."
                className="flex-1 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none bg-transparent"
              />
              <span className="text-[11px] text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded px-1.5 py-0.5 font-medium shrink-0 select-none">⌘F</span>
            </div>
          ) : (
            <button onClick={openSearch} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
              <Search size={16} />
            </button>
          )}
          <FieldsDropdown
            view={view}
            onViewChange={setView}
            fields={fields}
            onFieldsChange={(f) => setFields(f as FieldVisibility)}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter size={15} />
          </button>
          <button
            onClick={() => createTask('New Task', 'To Do')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Plus size={14} />
            Add Task
          </button>
        </div>
      </header>

      {view === 'Board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="flex gap-6 p-6 min-h-full items-start">
            {STATUSES.filter((s) => !hasActiveFilters || filteredByColumn[s].length > 0).map((status) => (
              <KanbanCol key={status} title={status} tasks={filteredByColumn[status]} onDrop={handleDrop} onAddTask={createTask} fields={fields} />
            ))}
          </div>
        </div>
      ) : (
        <ListView tasksByColumn={filteredByColumn} onAddTask={createTask} query={q} fields={fields} />
      )}
    </div>
  );
}
