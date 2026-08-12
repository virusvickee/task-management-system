'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown, ChevronRight,
  ChevronsUpDown, Settings, Sun, Moon, Check, X,
} from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';
import { apiFetch } from '@/lib/api';

type ThemeOption = 'light' | 'dark';

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

function UserMenuDropdown({ user, onClose }: { user?: { name?: string; email?: string } | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'theme' | 'color' | null>(null);
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const currentAccent = ACCENT_COLORS.find((c) => c.label === accentColor) ?? ACCENT_COLORS[0];

  return (
    <div
      ref={ref}
      className="theme-popover absolute left-2 top-[56px] z-[9999] w-[240px] min-w-[192px] rounded-md shadow-md py-2 select-none"
    >
      {/* User info */}
      <div className="flex flex-col items-center px-4 pb-3 mb-1 border-b border-[color:var(--base-border)]">
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative mt-1 mb-2">
          <img src="/avatar.png" alt="Dexter" className="w-full h-full object-cover" />
        </div>
        <p className="text-[13px] font-bold text-[var(--base-primary)]">{user?.name || 'Dexter'}</p>
        <p className="text-[11px] theme-popover-muted mt-0.5">{user?.email || 'dexter@gmail.com'}</p>
      </div>

      <div className="px-1.5 flex flex-col gap-0.5">
        {/* Light / Dark — full app */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSubmenu((s) => (s === 'theme' ? null : 'theme'))}
            onMouseEnter={() => setSubmenu('theme')}
            className={`fields-dropdown-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors${submenu === 'theme' ? ' fields-dropdown-item--active' : ''}`}
          >
            <Sun size={14} className="shrink-0" />
            <span className="flex-1 text-left">Light / Dark</span>
            <ChevronRight size={13} className="fields-dropdown-item-icon shrink-0" />
          </button>
          {submenu === 'theme' && (
            <div className="theme-popover absolute left-0 top-full mt-0.5 w-[192px] max-w-[calc(100vw-24px)] rounded-md py-1.5 z-[9999] select-none lg:left-full lg:top-0 lg:mt-0 lg:ml-1">
              {(['light', 'dark'] as ThemeOption[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setSubmenu(null); }}
                  className="fields-dropdown-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg"
                >
                  {t === 'light'
                    ? <Sun size={13} className="shrink-0" />
                    : <Moon size={13} className="shrink-0" />}
                  <span className="flex-1 text-left capitalize">{t}</span>
                  {theme === t && <Check size={12} className="shrink-0 text-[var(--accent-color)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Accent color — Add Task + highlights only */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSubmenu((s) => (s === 'color' ? null : 'color'))}
            onMouseEnter={() => setSubmenu('color')}
            className={`fields-dropdown-item w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors${submenu === 'color' ? ' fields-dropdown-item--active' : ''}`}
          >
            <span className={`w-3.5 h-3.5 rounded-sm ${currentAccent.swatch} shrink-0`} />
            <span className="flex-1 text-left">Accent Color</span>
            <ChevronRight size={13} className="fields-dropdown-item-icon shrink-0" />
          </button>
          {submenu === 'color' && (
            <div className="theme-popover absolute left-0 top-full mt-0.5 w-[192px] max-w-[calc(100vw-24px)] rounded-md py-1.5 z-[9999] select-none lg:left-full lg:top-0 lg:mt-0 lg:ml-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => { setAccentColor(c.label as AccentColor); setSubmenu(null); onClose(); }}
                  className="fields-dropdown-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg"
                >
                  <span className={`w-3.5 h-3.5 rounded-sm ${c.swatch} shrink-0`} />
                  <span className="flex-1 text-left">{c.label}</span>
                  {accentColor === c.label && <Check size={12} className="shrink-0 text-[var(--accent-color)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fields-dropdown-divider my-1" />

        <Link
          href="/dashboard/settings"
          onMouseEnter={() => setSubmenu(null)}
          onClick={onClose}
          className="fields-dropdown-item flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors"
        >
          <Settings size={14} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </Link>
      </div>
    </div>
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

  function handleNavClick() {
    if (window.innerWidth < 1024) onClose?.();
  }

  return (
    <aside className="dashboard-sidebar">
      {/* ── Mobile close button — only shown below lg ── */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-gray-400
                     hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-colors z-10 min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      )}

      {/* ── User trigger ── */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center w-full h-12 px-3 py-2 gap-2 rounded-xl mb-3
                   text-left hover:bg-[var(--base-muted)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative ring-1 ring-[color:var(--base-border)]">
          <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <span className="text-[13px] font-semibold flex-1 truncate sidebar-user-name">
          {user?.name || 'Dexter'}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-[var(--base-primary)]" />
      </button>

      {menuOpen && <UserMenuDropdown user={user} onClose={() => setMenuOpen(false)} />}

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
