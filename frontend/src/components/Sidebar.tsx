'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid, FolderOpen, ChevronDown, ChevronRight,
  ChevronsUpDown, Settings, Sun, Moon, Check, X,
} from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';
import { apiFetch } from '@/lib/api';

type ThemeOption = 'light' | 'dark';

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

  const currentAccent = ACCENT_COLORS.find((c) => c.label === accentColor) ?? ACCENT_COLORS[5];

  return (
    <div
      ref={ref}
      className="absolute left-2 top-[56px] z-[9999] w-[240px] min-w-[192px] rounded-md border border-gray-200 dark:border-gray-700 shadow-md py-2 select-none"
      style={{
        background: 'var(--base-popover, rgba(255, 255, 255, 1))',
        borderTop: '1px solid var(--custom-foreground-5, rgba(10, 10, 10, 0.05))',
      }}
    >
      {/* User info */}
      <div className="flex flex-col items-center px-4 pb-3 mb-1 border-b border-gray-100 dark:border-gray-800">
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative mt-1 mb-2 ring-1 ring-gray-200 dark:ring-gray-700">
          <img src="/avatar.png" alt="Dexter" className="w-full h-full object-cover" />
        </div>
        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{user?.name || 'Dexter'}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{user?.email || 'dexter@gmail.com'}</p>
      </div>

      <div className="px-1.5 flex flex-col gap-0.5">
        {/* Change Theme */}
        <div className="relative">
          <button
            onMouseEnter={() => setSubmenu('theme')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${submenu === 'theme' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
          >
            <Sun size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
            <span className="flex-1 text-left">Change Theme</span>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
          </button>
          {submenu === 'theme' && (
            <div
              className="absolute left-full top-0 ml-1 w-[192px] min-w-[192px] rounded-md border border-gray-200 dark:border-gray-700 py-1.5 z-[9999] select-none"
              style={{
                background: 'var(--base-popover, rgba(255, 255, 255, 1))',
                borderTop: '1px solid var(--custom-foreground-5, rgba(10, 10, 10, 0.05))',
                boxShadow:
                  'var(--shadowmd2offset-x, 0px) var(--shadowmd2offset-y, 2px) var(--shadowmd2blur-radius, 4px) var(--shadowmd2spread-radius, -2px) var(--shadowmd2color, rgba(16, 24, 40, 0.06))',
              }}
            >
              {(['light', 'dark'] as ThemeOption[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setSubmenu(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                >
                  {t === 'light'
                    ? <Sun size={13} className="text-gray-500 shrink-0" />
                    : <Moon size={13} className="text-gray-500 shrink-0" />}
                  <span className="flex-1 text-left capitalize">{t}</span>
                  {theme === t && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Mode */}
        <div className="relative">
          <button
            onMouseEnter={() => setSubmenu('color')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${submenu === 'color' ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
          >
            <span className={`w-3.5 h-3.5 rounded-sm ${currentAccent.swatch} shrink-0`} />
            <span className="flex-1 text-left">Color Mode</span>
            <ChevronRight size={13} className="text-gray-400 shrink-0" />
          </button>
          {submenu === 'color' && (
            <div
              className="absolute left-full top-0 ml-1 w-[192px] min-w-[192px] rounded-md border border-gray-200 dark:border-gray-700 py-1.5 z-[9999] select-none"
              style={{
                background: 'var(--base-popover, rgba(255, 255, 255, 1))',
                borderTop: '1px solid var(--custom-foreground-5, rgba(10, 10, 10, 0.05))',
                boxShadow:
                  'var(--shadowmd2offset-x, 0px) var(--shadowmd2offset-y, 2px) var(--shadowmd2blur-radius, 4px) var(--shadowmd2spread-radius, -2px) var(--shadowmd2color, rgba(16, 24, 40, 0.06))',
              }}
            >
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => { setAccentColor(c.label as AccentColor); setSubmenu(null); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                >
                  {c.label === 'Black' ? (
                    <span className="w-3.5 h-3.5 rounded-sm bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-600 shrink-0" />
                  ) : (
                    <span className={`w-3.5 h-3.5 rounded-sm ${c.swatch} shrink-0`} />
                  )}
                  <span className="flex-1 text-left">{c.label}</span>
                  {accentColor === c.label && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

        <Link
          href="/dashboard/settings"
          onMouseEnter={() => setSubmenu(null)}
          onClick={onClose}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Settings size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
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

  return (
    <aside
      className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col py-3 px-2.5 relative h-full"
      style={{ background: 'var(--base-sidebar, rgba(250, 250, 250, 1))' }}
    >
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
                   text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative ring-1 ring-gray-200 dark:ring-gray-700">
          <img src="/avatar.png" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <span className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 flex-1 truncate">
          {user?.name || 'Dexter'}
        </span>
        <ChevronsUpDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
      </button>

      {menuOpen && <UserMenuDropdown user={user} onClose={() => setMenuOpen(false)} />}

      {/* ── Workspace collapsible section ── */}
      <button
        onClick={() => setWorkspaceOpen((v) => !v)}
        className="flex items-center justify-between w-full h-8 px-3 rounded-xl mb-1
                   text-sm font-medium text-gray-500 dark:text-gray-400
                   hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            onClick={onClose}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              tasksActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900'
            }`}
            style={tasksActive ? { backgroundColor: 'var(--accent-color)' } : {}}
          >
            <LayoutGrid size={14} className={tasksActive ? 'text-white shrink-0' : 'text-gray-500 dark:text-gray-400 shrink-0'} />
            Tasks
          </Link>
          <Link
            href="/dashboard/projects"
            onClick={onClose}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              projectsActive ? 'text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900'
            }`}
            style={projectsActive ? { backgroundColor: 'var(--accent-color)' } : {}}
          >
            <FolderOpen size={14} className={projectsActive ? 'text-white shrink-0' : 'text-gray-500 dark:text-gray-500 shrink-0'} />
            Projects
          </Link>
        </nav>
      )}
    </aside>
  );
}
