'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Plus, MoreHorizontal,
  BarChart2, ChevronDown, FolderKanban,
} from 'lucide-react';

import { SEED_PROJECTS } from '@/lib/projects';
import type { Project } from '@/lib/projects';

import { useSidebar } from '@/context/sidebar-context';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  'Urgent':      { color: 'text-red-600',    label: 'Urgent' },
  'High':        { color: 'text-red-500',    label: 'High' },
  'Medium':      { color: 'text-orange-500', label: 'Medium' },
  'Low':         { color: 'text-gray-400',   label: 'Low' },
  'No Priority': { color: 'text-gray-400',   label: 'No Priority' },
};

/* ── Avatar ───────────────────────────────────────────── */
function Avatar({ name }: { name: string }) {
  const COLORS = ['bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-blue-500'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className={`w-6 h-6 rounded-full ${COLORS[h % COLORS.length]} flex items-center justify-center text-white text-[10px] font-semibold shrink-0`}>
      {initials}
    </span>
  );
}

/* ── Projects Page ────────────────────────────────────── */
export default function ProjectsPage() {
  const router = useRouter();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [projects, setProjects] = useState<Project[]>(SEED_PROJECTS);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery]           = useState('');
  const [adding, setAdding]         = useState(false);
  const [newName, setNewName]        = useState('');
  const searchRef  = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  function openSearch()  { setSearchOpen(true);  setTimeout(() => searchRef.current?.focus(), 0); }
  function closeSearch() { setSearchOpen(false);  setQuery(''); }

  function startAdding() {
    setAdding(true);
    setTimeout(() => addInputRef.current?.focus(), 0);
  }

  function commitAdd() {
    const name = newName.trim();
    if (name) {
      setProjects((prev) => [
        ...prev,
        {
          id: `proj-${Date.now()}`,
          name,
          priority: 'No Priority',
          lead: 'You',
          dueDate: null,
        },
      ]);
    }
    setNewName('');
    setAdding(false);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter')  commitAdd();
    if (e.key === 'Escape') { setNewName(''); setAdding(false); }
  }

  const q = query.toLowerCase();
  const filtered = q ? projects.filter((p) => p.name.toLowerCase().includes(q)) : projects;

  return (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <FolderKanban size={18} className="text-gray-400 dark:text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          {q && (
            <span className="text-[12px] text-gray-400 dark:text-gray-500">
              {filtered.length} results
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="flex items-center gap-2 px-3 py-1.5 w-[280px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                onBlur={closeSearch}
                placeholder="Search projects..."
                className="flex-1 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none bg-transparent"
              />
            </div>
          ) : (
            <button
              onClick={openSearch}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Search size={16} />
            </button>
          )}
          <button className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter size={15} />
          </button>
          <button
            onClick={startAdding}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Plus size={14} />
            Add Project
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 w-full">
                  <button className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    Projects <ChevronDown size={11} />
                  </button>
                </th>
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Priority</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Lead</th>
                <th className="text-left px-4 py-2.5 text-[12px] font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Due Date</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const pc = PRIORITY_CONFIG[project.priority];
                return (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-12"
                  >
                    {/* Project name — clickable link */}
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-[14px] font-medium text-gray-900 dark:text-gray-100 hover:underline flex items-center gap-2 group"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-bold"
                          style={{ backgroundColor: 'var(--accent-color)' }}
                        >
                          {project.name[0].toUpperCase()}
                        </span>
                        {project.name}
                      </Link>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2">
                      <span className={`flex items-center gap-1.5 text-[13px] font-medium ${pc.color}`}>
                        <BarChart2 size={13} className="shrink-0" />
                        {pc.label}
                      </span>
                    </td>

                    {/* Lead */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={project.lead} />
                        <span className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-nowrap">{project.lead}</span>
                      </div>
                    </td>

                    {/* Due Date */}
                    <td className="px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 text-right">
                      <button
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add project row */}
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
            {adding ? (
              <input
                ref={addInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKey}
                onBlur={commitAdd}
                placeholder="Project name…"
                className="w-full text-sm text-gray-800 dark:text-gray-200 dark:bg-gray-800 placeholder-gray-400 outline-none border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5"
              />
            ) : (
              <button
                onClick={startAdding}
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
              >
                <Plus size={13} />
                Add Projects
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center text-gray-400 dark:text-gray-600 text-sm">
            No projects found
          </div>
        )}
      </div>
    </div>
  );
}
