'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown, ChevronsUpDown, X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import UserMenuDropdown from '@/components/UserMenuDropdown';

function SidebarTasksIcon() {
  return (
    <svg
      className="sidebar-nav-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2.75"
        y="2.75"
        width="5"
        height="2.5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9.25"
        y="2.75"
        width="3.5"
        height="4.75"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2.75"
        y="6"
        width="5"
        height="7.25"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9.25"
        y="8.75"
        width="3.5"
        height="4.5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SidebarProjectsIcon() {
  return (
    <svg
      className="sidebar-nav-icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5.5 2.83h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2.75 5.25h10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="2.75"
        y="6.75"
        width="10.5"
        height="7.16"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const tasksActive    = pathname === '/dashboard' || pathname.startsWith('/dashboard/tasks');
  const projectsActive = pathname.startsWith('/dashboard/projects');
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    if (localStorage.getItem('tms-token')) {
      apiFetch('/users/me')
        .then(setUser)
        .catch(() => {});
    }
  }, [menuOpen, pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleNavClick() {
    if (window.innerWidth < 1024) onClose?.();
  }

  return (
    <aside className="dashboard-sidebar">
      {/* ── User trigger + mobile close (separate controls — no overlap) ── */}
      <div className="flex items-center gap-1 mb-3">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center flex-1 min-w-0 h-12 px-3 py-2 gap-2 rounded-xl
                     text-left hover:bg-[var(--base-muted)] transition-colors"
        >
          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative ring-1 ring-[color:var(--base-border)]">
            <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <span className="text-[13px] font-semibold flex-1 truncate sidebar-user-name">
            {user?.name || 'Guest'}
          </span>
          <ChevronsUpDown size={14} className="shrink-0 text-[var(--base-primary)]" />
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {menuOpen && (
        <UserMenuDropdown
          user={user}
          onClose={() => setMenuOpen(false)}
          className="left-2 top-[56px]"
        />
      )}

      {/* ── Workspace collapsible section ── */}
      <button
        onClick={() => setWorkspaceOpen((v) => !v)}
        className="flex items-center justify-between w-full h-8 px-3 rounded-xl mb-1
                   text-sm font-medium text-[var(--base-muted-foreground)]
                   hover:bg-[var(--base-muted)] transition-colors"
      >
        <span>Workspace</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            workspaceOpen ? '' : '-rotate-90'
          }`}
        />
      </button>

      {/* Collapsible nav items */}
      {workspaceOpen && (
        <nav className="flex flex-col gap-0.5">
          <Link
            href="/dashboard"
            onClick={handleNavClick}
            className={`sidebar-nav-link flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              tasksActive ? 'sidebar-nav-link--active' : ''
            }`}
          >
            <SidebarTasksIcon />
            Tasks
          </Link>
          <Link
            href="/dashboard/projects"
            onClick={handleNavClick}
            className={`sidebar-nav-link flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              projectsActive ? 'sidebar-nav-link--active' : ''
            }`}
          >
            <SidebarProjectsIcon />
            Projects
          </Link>
        </nav>
      )}
    </aside>
  );
}
