'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckSquare, FolderKanban, ChevronDown, ChevronRight,
  Settings, Sun, Moon, Check,
} from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';

type ThemeOption = 'light' | 'dark';

function UserMenuDropdown({ onClose }: { onClose: () => void }) {
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
      className="absolute left-2 top-[60px] z-50 w-[220px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 select-none"
    >
      {/* User info block */}
      <div className="flex flex-col items-center px-4 pb-3 mb-1 border-b border-gray-100 dark:border-gray-800">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mt-1 mb-2"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          D
        </div>
        <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Dexter</p>
        <p className="text-[11px] text-gray-400 mt-0.5">dexter@gmail.com</p>
      </div>

      {/* Menu items */}
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
            <div className="absolute left-full top-0 ml-1 w-[160px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
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
            <div className="absolute left-full top-0 ml-1 w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
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

        {/* Divider before Settings */}
        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

        {/* Settings */}
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

export default function Sidebar() {
  const pathname = usePathname();
  const tasksActive    = pathname === '/dashboard' || pathname.startsWith('/dashboard/tasks');
  const projectsActive = pathname.startsWith('/dashboard/projects');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 px-3 relative">
      {/* Workspace header / user menu trigger */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-2 px-2 mb-5 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg py-1 transition-colors"
      >
        <div
          className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          D
        </div>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1">Dexter</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* User menu dropdown */}
      {menuOpen && <UserMenuDropdown onClose={() => setMenuOpen(false)} />}

      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Workspace</span>
        <ChevronDown size={12} className="text-gray-300 dark:text-gray-600" />
      </div>
      <nav className="flex flex-col gap-0.5">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] font-medium w-full transition-colors ${
            tasksActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          style={tasksActive ? { backgroundColor: 'var(--accent-color)' } : {}}
        >
          <CheckSquare size={15} className={tasksActive ? 'text-white shrink-0' : 'text-gray-600 dark:text-gray-400 shrink-0'} />
          Tasks
        </Link>
        <Link
          href="/dashboard/projects"
          className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] font-medium w-full transition-colors ${
            projectsActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          style={projectsActive ? { backgroundColor: 'var(--accent-color)' } : {}}
        >
          <FolderKanban size={15} className={projectsActive ? 'text-white shrink-0' : 'text-gray-400 dark:text-gray-500 shrink-0'} />
          Projects
        </Link>
      </nav>
    </aside>
  );
}
