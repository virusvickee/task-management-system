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
  const isDark = theme === 'dark';
  const popoverBg = isDark ? '#1e1e1e' : '#ffffff';
  const tc = isDark ? '#e5e5e5' : '#171717';
  const borderC = isDark ? 'rgba(55,55,55,1)' : 'rgba(229,229,229,1)';

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
      className="absolute left-2 top-[56px] z-[9999] w-[240px] min-w-[192px] rounded-md shadow-md py-2 select-none"
      style={{ background: popoverBg, border: `1px solid ${borderC}` }}
    >
      {/* User info */}
      <div className="flex flex-col items-center px-4 pb-3 mb-1" style={{ borderBottom: `1px solid ${borderC}` }}>
        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative mt-1 mb-2">
          <img src="/avatar.png" alt="Dexter" className="w-full h-full object-cover" />
        </div>
        <p className="text-[13px] font-bold" style={{ color: tc }}>{user?.name || 'Dexter'}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{user?.email || 'dexter@gmail.com'}</p>
      </div>

      <div className="px-1.5 flex flex-col gap-0.5">
        {/* Change Theme */}
        <div className="relative">
          <button
            onMouseEnter={() => setSubmenu('theme')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors`}
            style={{ color: tc, background: submenu === 'theme' ? (isDark ? '#2a2a2a' : '#f5f5f5') : 'transparent' }}
          >
            <Sun size={14} style={{ color: tc }} className="shrink-0" />
            <span className="flex-1 text-left">Change Theme</span>
            <ChevronRight size={13} style={{ color: tc }} className="shrink-0" />
          </button>
          {submenu === 'theme' && (
            <div
              className="absolute left-0 top-full mt-0.5 w-[192px] max-w-[calc(100vw-24px)] rounded-md py-1.5 z-[9999] select-none lg:left-full lg:top-0 lg:mt-0 lg:ml-1"
              style={{ background: popoverBg, border: `1px solid ${borderC}` }}
            >
              {(['light', 'dark'] as ThemeOption[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setSubmenu(null); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg"
                  style={{ color: tc }}
                >
                  {t === 'light'
                    ? <Sun size={13} style={{ color: tc }} className="shrink-0" />
                    : <Moon size={13} style={{ color: tc }} className="shrink-0" />}
                  <span className="flex-1 text-left capitalize">{t}</span>
                  {theme === t && <Check size={12} style={{ color: tc }} className="shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Mode */}
        <div className="relative">
          <button
            onMouseEnter={() => setSubmenu('color')}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors`}
            style={{ color: tc, background: submenu === 'color' ? (isDark ? '#2a2a2a' : '#f5f5f5') : 'transparent' }}
          >
            <span className={`w-3.5 h-3.5 rounded-sm ${currentAccent.swatch} shrink-0`} />
            <span className="flex-1 text-left">Color Mode</span>
            <ChevronRight size={13} style={{ color: tc }} className="shrink-0" />
          </button>
          {submenu === 'color' && (
            <div
              className="absolute left-0 top-full mt-0.5 w-[192px] max-w-[calc(100vw-24px)] rounded-md py-1.5 z-[9999] select-none lg:left-full lg:top-0 lg:mt-0 lg:ml-1"
              style={{ background: popoverBg, border: `1px solid ${borderC}` }}
            >
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.label}
                  onClick={() => { setAccentColor(c.label as AccentColor); setSubmenu(null); onClose(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg"
                  style={{ color: tc }}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm ${c.swatch} shrink-0`} />
                  <span className="flex-1 text-left">{c.label}</span>
                  {accentColor === c.label && <Check size={12} style={{ color: tc }} className="shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="my-1" style={{ borderTop: `1px solid ${borderC}` }} />

        <Link
          href="/dashboard/settings"
          onMouseEnter={() => setSubmenu(null)}
          onClick={onClose}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors"
          style={{ color: tc }}
        >
          <Settings size={14} style={{ color: tc }} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </Link>
      </div>
    </div>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const tc = theme === 'dark' ? '#e5e5e5' : '#171717';
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
        <span className="text-[13px] font-semibold flex-1 truncate" style={{ color: tc }}>
          {user?.name || 'Dexter'}
        </span>
        <ChevronsUpDown size={14} style={{ color: tc }} className="shrink-0" />
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
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              tasksActive ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900'
            }`}
          >
            <LayoutGrid size={14} className="text-gray-500 dark:text-gray-400 shrink-0" />
            Tasks
          </Link>
          <Link
            href="/dashboard/projects"
            onClick={handleNavClick}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium w-full transition-colors min-h-[40px] ${
              projectsActive ? 'text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900'
            }`}
          >
            <FolderOpen size={14} className="text-gray-500 dark:text-gray-500 shrink-0" />
            Projects
          </Link>
        </nav>
      )}
    </aside>
  );
}
