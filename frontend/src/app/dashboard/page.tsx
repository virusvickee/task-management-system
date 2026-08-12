'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
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
import { useTheme } from '@/context/theme-context';

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
  const { theme } = useTheme();
  const bg = theme === 'dark' ? '#111111' : '#ffffff';
  const tc = theme === 'dark' ? '#e5e5e5' : '#171717';
  const borderC = theme === 'dark' ? 'rgba(55,55,55,1)' : 'rgba(229,229,229,1)';
  const [view, setView]               = useState<'Board' | 'List'>('Board');
  const [searchOpen, setSearchOpen]   = useState(false);
  const [query, setQuery]             = useState('');
  const [filters, setFilters]         = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields]           = useState<FieldVisibility>({
    priority: true, members: true, dueDate: true,
    labels: false, status: false, reporter: false,
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const { tasksByColumn, createTask, updateTask, refetch } = useTasks();

  useEffect(() => {
    if (pathname === '/dashboard') refetch();
  }, [pathname, refetch]);

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
      {/* ── Top header bar ── */}
      <header className="flex items-center w-full px-3 sm:px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0" style={{ background: bg }}>
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          style={{ width: '44px', height: '28px', color: tc }}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={15} />
        </button>
        <div className="w-px h-[15px] shrink-0" style={{ background: borderC }} />
      </header>

      {/* ── Title & Tools Row ── */}
      <div className="flex items-center justify-between w-full min-h-[32px] px-3 sm:px-4 gap-2 shrink-0 mt-3" style={{ background: bg }}>
        {/* Left: title + result count */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <h1 className="text-base font-semibold leading-none tracking-normal" style={{ color: tc }}>Tasks</h1>
          {hasActiveFilters && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {Object.values(filteredByColumn).flat().length} results
            </span>
          )}
        </div>

        {/* Right: tools */}
        <div className="flex items-center gap-1.5 sm:gap-2 h-8 shrink-0">
          {/* Search */}
          {searchOpen ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 w-[160px] sm:w-[240px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                onBlur={closeSearch}
                placeholder="Search tasks…"
                className="flex-1 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none bg-transparent min-w-0"
              />
            </div>
          ) : (
            <button
              onClick={openSearch}
              className="w-8 h-8 flex items-center justify-center rounded gap-1.5 border transition-colors"
              style={{ padding: '8px 12px', borderColor: borderC, borderRadius: '4px' }}
              aria-label="Search"
            >
              <Search size={14} style={{ color: tc }} className="shrink-0" />
            </button>
          )}

          {/* Fields dropdown */}
          <FieldsDropdown
            view={view}
            onViewChange={setView}
            fields={fields}
            onFieldsChange={(f) => setFields(f as FieldVisibility)}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Filter button */}
          <button
            className="w-8 h-8 flex items-center justify-center transition-colors"
            style={{ padding: '8px 12px', borderRadius: '4px', border: `1px solid ${borderC}` }}
            aria-label="Filter"
          >
            <Filter size={14} style={{ color: tc }} />
          </button>

          {/* Add Task — always visible */}
          <button
            onClick={() => createTask('New Task', 'To Do')}
            className="flex items-center justify-center gap-1 text-[13px] font-medium text-white rounded-md hover:opacity-90 transition-opacity w-[96px] h-8 shrink-0 bg-[rgba(23,23,23,1)]"
            style={{ padding: '8px 12px' }}
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {view === 'Board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-none mt-3" style={{ background: bg }}>
          <div
            className="flex items-start"
            style={{ minWidth: 'max-content', gap: '16px', padding: '12px 16px' }}
          >
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
