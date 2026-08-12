'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, User, Sun, Square, Pencil, Check, Moon } from 'lucide-react';
import { useTheme, ACCENT_COLORS, DEFAULT_ACCENT, DEFAULT_THEME } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';
import { apiFetch, guestLogin, logout } from '@/lib/api';

type Section = 'profile' | 'theme' | 'color';

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'theme',   label: 'Theme',   icon: <Sun size={15} /> },
  { id: 'color',   label: 'Color',   icon: <Square size={15} className="fill-current" /> },
];

interface UserProfile {
  name: string;
  email?: string;
  title?: string;
  username?: string;
}

function ProfileSection() {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Dexter',
    email: 'dexter@gmail.com',
    title: '',
    username: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        if (!localStorage.getItem('tms-token')) await guestLogin();
        const data = await apiFetch('/users/me');
        if (data) {
          setProfile({
            name: data.name || 'Dexter',
            email: data.email || 'dexter@gmail.com',
            title: data.title || '',
            username: data.username || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const updateField = async (field: keyof UserProfile, value: string) => {
    const prev = { ...profile };
    const updated = { ...profile, [field]: value };
    setProfile(updated);

    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
      setProfile(prev);
    }
  };

  const handleLeaveWorkspace = () => {
    if (confirm('Are you sure you want to leave? This will end your guest session.')) {
      logout();
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm">Loading profile…</div>
      ) : (
        <>
          {/* Main card */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 mb-8">

            {/* Profile picture */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Profile picture</span>
              <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden relative ring-1 ring-gray-200 dark:ring-gray-700">
                <img src="/avatar.png" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Email</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-gray-500 dark:text-gray-400 truncate max-w-[160px] sm:max-w-none">{profile.email || 'dexter@gmail.com'}</span>
                <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0" title="Read only">
                  <Pencil size={13} className="text-gray-400 opacity-60" />
                </button>
              </div>
            </div>

            {/* Full name */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4">
              <span className="text-[13px] text-gray-700 dark:text-gray-300 font-medium shrink-0">Full name</span>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                onBlur={(e) => updateField('name', e.target.value)}
                className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800
                           rounded-lg px-3 py-1.5 w-full sm:max-w-[200px] sm:text-right outline-none
                           focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 font-medium"
              />
            </div>

            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4">
              <div className="shrink-0">
                <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Title</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Your job title or role</p>
              </div>
              <input
                value={profile.title || ''}
                onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                onBlur={(e) => updateField('title', e.target.value)}
                placeholder="Designer"
                className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800
                           rounded-lg px-3 py-1.5 w-full sm:max-w-[200px] sm:text-right outline-none
                           focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600
                           placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* Username */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4">
              <div className="shrink-0">
                <p className="text-[13px] text-gray-700 dark:text-gray-300 font-medium">Username</p>
                <p className="text-[11px] text-gray-400 mt-0.5">One word, like a nickname or first name</p>
              </div>
              <input
                value={profile.username || ''}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                onBlur={(e) => updateField('username', e.target.value)}
                placeholder="Dexuser"
                className="text-[13px] text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800
                           rounded-lg px-3 py-1.5 w-full sm:max-w-[200px] sm:text-right outline-none
                           focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600
                           placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Workspace access */}
          <p className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-3">Workspace access</p>
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4">
              <span className="text-[13px] text-gray-400">Remove yourself from the workspace</span>
              <button
                onClick={handleLeaveWorkspace}
                className="text-[13px] font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-400 transition-colors px-3 py-1.5 rounded-lg self-start sm:self-auto whitespace-nowrap min-h-[40px]"
              >
                Leave Workspace
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeSection() {
  const { theme, setTheme, accentColor, resetToDefaults } = useTheme();
  const isDefault = theme === DEFAULT_THEME && accentColor === DEFAULT_ACCENT;

  return (
    <div className="w-full">
      <h1 className="settings-section-title">Theme</h1>
      <p className="settings-section-desc mb-4">
        Default is <strong>Light</strong> with the normal Figma look. Switch to Dark for the whole app, or restore defaults below.
      </p>
      <div className="settings-option-list mb-4">
        {(['light', 'dark'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={`settings-option-btn${theme === t ? ' settings-option-btn--active' : ''}`}
            aria-pressed={theme === t}
          >
            <span className="settings-theme-preview" data-theme-preview={t} aria-hidden="true">
              <span className="settings-theme-preview-bar" />
              <span className="settings-theme-preview-line" />
              <span className="settings-theme-preview-line settings-theme-preview-line--short" />
            </span>
            <span className="settings-option-icon">
              {t === 'light' ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="settings-option-label capitalize">
              {t}{t === 'light' ? ' (Default)' : ''}
            </span>
            {theme === t && <Check size={14} className="settings-option-check shrink-0" />}
          </button>
        ))}
      </div>
      {!isDefault && (
        <button
          type="button"
          onClick={resetToDefaults}
          className="settings-restore-defaults-btn"
        >
          Restore default (Light + Black)
        </button>
      )}
    </div>
  );
}

function ColorSection() {
  const { accentColor, setAccentColor } = useTheme();

  return (
    <div className="w-full">
      <h1 className="settings-section-title">Color</h1>
      <p className="settings-section-desc mb-4">
        Default is <strong>Black</strong> — normal dark Add Task button. Other colors are optional accents only.
      </p>
      <div className="settings-option-list">
        {ACCENT_COLORS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => setAccentColor(c.label as AccentColor)}
            className={`settings-option-btn${accentColor === c.label ? ' settings-option-btn--active' : ''}`}
            aria-pressed={accentColor === c.label}
          >
            <span
              className={`settings-color-swatch ${c.label === 'Black' ? 'settings-color-swatch--black' : c.swatch}`}
              style={c.label !== 'Black' ? { backgroundColor: c.hex } : undefined}
            />
            <span className="settings-option-label">
              {c.label}{c.label === DEFAULT_ACCENT ? ' (Default)' : ''}
            </span>
            {accentColor === c.label && <Check size={14} className="settings-option-check shrink-0" />}
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
    <div className="flex flex-col md:flex-row h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden w-full">
      {/* ── Settings sidebar / tab bar ── */}
      <aside className="settings-sidebar w-full md:w-[220px] shrink-0
                        border-b md:border-b-0 md:border-r border-[color:var(--base-border)]
                        flex flex-col py-2 md:py-3 px-3">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-1.5 mb-1 md:mb-2 text-[13px]
                     text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100
                     transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800
                     min-h-[40px]"
        >
          <ArrowLeft size={14} className="shrink-0" />
          Back to app
        </Link>

        {/* Search — desktop only */}
        <div className="relative mb-2 px-1 hidden md:block">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-8 pr-3 py-1.5 text-[13px] border border-gray-200 dark:border-gray-700
                       rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                       placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-gray-300
                       dark:focus:ring-gray-600"
          />
        </div>

        {/* Nav — horizontal scrollable tabs on mobile, vertical list on md+ */}
        <nav className="flex flex-row overflow-x-auto md:flex-col gap-1 md:gap-0.5
                        pb-1 md:pb-0 scrollbar-none -mx-1 px-1">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`settings-nav-btn flex items-center gap-2 px-3 py-2 rounded-lg text-[13px]
                          whitespace-nowrap md:w-full text-left transition-colors min-h-[40px] ${
                active === n.id ? 'settings-nav-btn--active' : ''
              }`}
            >
              {n.icon}
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex justify-center items-start w-full min-w-0">
        <div className="settings-content-panel w-full max-w-[640px] min-h-0 p-4 sm:p-6 flex flex-col">
          {active === 'profile' && <ProfileSection />}
          {active === 'theme'   && <ThemeSection />}
          {active === 'color'   && <ColorSection />}
        </div>
      </main>
    </div>
  );
}
