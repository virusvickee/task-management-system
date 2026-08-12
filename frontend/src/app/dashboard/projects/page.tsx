'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, PanelLeft } from 'lucide-react';

import { useProjects } from '@/hooks/useProjects';
import { useSearchShortcut } from '@/hooks/useSearchShortcut';
import FieldsDropdown from '@/components/FieldsDropdown';
import FilterDropdown, { EMPTY_FILTERS } from '@/components/FilterDropdown';
import type { TaskFilters } from '@/components/FilterDropdown';
import ProjectsTable from '@/components/ProjectsTable';
import ToolbarSearchInput, { type ToolbarSearchInputHandle } from '@/components/ToolbarSearchInput';
import { useSidebar } from '@/context/sidebar-context';

function matchesProjectFilters(
  project: { priority: string; dueDate?: string },
  filters: TaskFilters,
): boolean {
  if (filters.priorities.length > 0 && !filters.priorities.includes(project.priority)) {
    return false;
  }
  if (filters.dueDateRange) {
    const now = new Date();
    const due = project.dueDate ? new Date(project.dueDate) : null;
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eod = new Date(sod.getTime() + 86400000 - 1);
    const eow = new Date(sod.getTime() + (7 - sod.getDay()) * 86400000 - 1);
    if (filters.dueDateRange === 'no_date' && due !== null) return false;
    if (filters.dueDateRange === 'overdue' && (!due || due >= sod)) return false;
    if (filters.dueDateRange === 'today' && (!due || due < sod || due > eod)) return false;
    if (filters.dueDateRange === 'this_week' && (!due || due < sod || due > eow)) return false;
  }
  return true;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'Board' | 'List'>('List');
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [fields, setFields] = useState({
    priority: true,
    members: true,
    dueDate: true,
    labels: false,
    status: false,
    reporter: false,
  });
  const searchRef = useRef<ToolbarSearchInputHandle>(null);

  useSearchShortcut(() => searchRef.current?.open());

  const q = query.toLowerCase();

  const filtered = useMemo(() => {
    let list = projects.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesFilt = matchesProjectFilters(p, filters);
      return matchesQuery && matchesFilt;
    });
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [projects, q, filters]);

  const hasActiveFilters = q || Object.values(filters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== null
  );

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden bg-[var(--background)] text-[var(--foreground)] dashboard-page-root">
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
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-[var(--background)]">
        <div className="dashboard-page-shell dashboard-page-content">
          <div className="dashboard-page-toolbar shrink-0">
            <div className="flex items-center gap-2 min-w-0 min-h-8">
              <h1 className="dashboard-page-title truncate">Projects</h1>
              {hasActiveFilters && (
                <span className="dashboard-page-meta">
                  {filtered.length} results
                </span>
              )}
            </div>
            <div className="dashboard-page-toolbar-actions">
              <ToolbarSearchInput
                ref={searchRef}
                value={query}
                onChange={setQuery}
                placeholder="Design Homepage"
                aria-label="Search projects"
              />
              <FieldsDropdown
                view={view}
                onViewChange={setView}
                fields={fields}
                onFieldsChange={(f) => setFields(f as typeof fields)}
              />
              <FilterDropdown filters={filters} onFiltersChange={setFilters} ariaLabel="Filter projects" />
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="dashboard-toolbar-add-task-btn"
              >
                <Plus size={14} strokeWidth={2} className="dashboard-toolbar-icon shrink-0" />
                <span className="dashboard-toolbar-add-task-label">Add Task</span>
              </button>
            </div>
          </div>

          <ProjectsTable
            projects={filtered}
            loading={loading}
            fields={{
              priority: fields.priority,
              members: fields.members,
              dueDate: fields.dueDate,
            }}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onCreate={createProject}
          />
        </div>
      </div>
    </div>
  );
}
