'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, User, Sun, Square, Pencil, Check, Moon } from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';

type Section = 'profile' | 'theme' | 'color';

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'theme',   label: 'Theme',   icon: <Sun size={15} /> },
  { id: 'color',   label: 'Color',   icon: <Square size={15} className="fill-current" /> },
];

function ProfileSection() {
  return (
    <div className="max-w-[560px]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

      {/* Main card */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 mb-8">

        {/* Profile picture */}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Profile picture</span>
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--accent-color)' }}
            title="Change avatar"
          >
            D
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Email</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500 dark:text-gray-400">dexter@gmail.com</span>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Pencil size={13} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Full name */}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Full name</span>
          <input
            defaultValue="Dexter"
            className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 w-44 text-right outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Title</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Your job title or role</p>
          </div>
          <input
            placeholder="Designer"
            className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 w-44 text-right outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400"
          />
        </div>

        {/* Username */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Username</p>
            <p className="text-[11px] text-gray-400 mt-0.5">One word, like a nickname or first name</p>
          </div>
          <input
            placeholder="Dexuser"
            className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5 w-44 text-right outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Workspace access */}
      <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Workspace access</p>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[13px] text-gray-400">Remove yourself from the workspace</span>
          <button className="text-[13px] font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors px-3 py-1.5 rounded-lg">
            Leave Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="max-w-[560px]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Theme</h1>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {(['light', 'dark'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t === 'light'
              ? <Sun size={15} className="text-gray-500 shrink-0" />
              : <Moon size={15} className="text-gray-500 shrink-0" />}
            <span className="flex-1 text-left text-[13px] text-gray-700 dark:text-gray-300 capitalize">{t}</span>
            {theme === t && <Check size={14} className="text-gray-900 dark:text-gray-100 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorSection() {
  const { accentColor, setAccentColor } = useTheme();
  return (
    <div className="max-w-[560px]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Color</h1>
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.label}
            onClick={() => setAccentColor(c.label as AccentColor)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span
              className={`w-4 h-4 rounded-sm shrink-0 ${c.label === 'Black' ? 'bg-gray-900 ring-1 ring-gray-300 dark:ring-gray-600' : c.swatch}`}
            />
            <span className="flex-1 text-left text-[13px] text-gray-700 dark:text-gray-300">{c.label}</span>
            {accentColor === c.label && <Check size={14} className="text-gray-900 dark:text-gray-100 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>('profile');
  const [search, setSearch] = useState('');

  const filtered = NAV.filter((n) => n.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden w-full">
      {/* Settings sidebar */}
      <aside className="w-[220px] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col py-4 px-3">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-2 mb-3 text-[13px] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={14} className="shrink-0" />
          Back to app
        </Link>

        {/* Search */}
        <div className="relative mb-3 px-1">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] w-full text-left transition-colors ${
                active === n.id
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-10">
        {active === 'profile' && <ProfileSection />}
        {active === 'theme'   && <ThemeSection />}
        {active === 'color'   && <ColorSection />}
      </main>
    </div>
  );
}
