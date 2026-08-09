'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Search, Filter, Plus, MoreHorizontal,
  BarChart2, ChevronDown, FolderKanban,
} from 'lucide-react';

import { useProjects } from '@/hooks/useProjects';

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
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { projects, loading, createProject } = useProjects();
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
      createProject(name);
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
      {/* ── Header ── */}
      <header className="flex items-center w-full px-3 sm:px-4 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors
                     min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md
                     hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </header>

      {/* ── Title & Tools Row ── */}
      <div className="flex items-center justify-between w-full px-3 sm:px-4 py-3 bg-white dark:bg-gray-900 shrink-0 border-b border-gray-100 dark:border-gray-800/60 gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <FolderKanban size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 truncate">Projects</h1>
          {q && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {filtered.length} results
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {searchOpen ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 w-[160px] sm:w-[240px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
                onBlur={closeSearch}
                placeholder="Search projects…"
                className="flex-1 text-[13px] text-gray-800 dark:text-gray-200 placeholder-gray-400 outline-none bg-transparent min-w-0"
              />
            </div>
          ) : (
            <button
              onClick={openSearch}
              className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-400
                         hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-md
                         hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Search size={16} />
            </button>
          )}
          <button className="min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-400
                             hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg
                             border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Filter size={15} />
          </button>
          <button
            onClick={startAdding}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[13px] text-white
                       font-medium rounded-lg hover:opacity-90 transition-opacity min-h-[40px] whitespace-nowrap"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <Plus size={14} />
            <span className="hidden xs:inline sm:inline">Add Project</span>
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          {/* Horizontally scrollable on mobile */}
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full border-collapse" style={{ minWidth: '520px' }}>
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
                      key={project._id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-12"
                    >
                      <td className="px-4 py-2">
                        <Link
                          href={`/dashboard/projects/${project._id}`}
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
                      <td className="px-4 py-2">
                        <span className={`flex items-center gap-1.5 text-[13px] font-medium ${pc.color}`}>
                          <BarChart2 size={13} className="shrink-0" />
                          {pc.label}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={project.lead ?? 'Unknown'} />
                          <span className="text-[13px] text-gray-700 dark:text-gray-300 whitespace-nowrap">{project.lead ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
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
          </div>

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
                className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1 min-h-[36px]"
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
