'use client';

import { createContext, useContext, useLayoutEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

export type AccentColor = 'Amber' | 'Blue' | 'Pink' | 'Rose' | 'Emerald' | 'Black';

export const THEME_KEY = 'tms-theme';
export const ACCENT_KEY = 'tms-accent';

export const DEFAULT_THEME: Theme = 'light';
export const DEFAULT_ACCENT: AccentColor = 'Black';

export const THEME_RESET_EVENT = 'tms-theme-reset';

const ACCENT_HEX: Record<AccentColor, string> = {
  Black: '#171717',
  Blue: '#3b82f6',
  Pink: '#ec4899',
  Rose: '#f43f5e',
  Emerald: '#10b981',
  Amber: '#f59e0b',
};

/** Default first — normal Figma look is Light + Black. */
export const ACCENT_COLORS: { label: AccentColor; hex: string; swatch: string }[] = [
  { label: 'Black', hex: '#171717', swatch: 'bg-gray-900' },
  { label: 'Blue', hex: '#3b82f6', swatch: 'bg-blue-500' },
  { label: 'Pink', hex: '#ec4899', swatch: 'bg-pink-500' },
  { label: 'Rose', hex: '#f43f5e', swatch: 'bg-rose-500' },
  { label: 'Emerald', hex: '#10b981', swatch: 'bg-emerald-500' },
  { label: 'Amber', hex: '#f59e0b', swatch: 'bg-amber-400' },
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (a: AccentColor) => void;
  resetToDefaults: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function currentThemeMode(): Theme {
  const mode = document.documentElement.dataset.theme;
  return mode === 'dark' ? 'dark' : 'light';
}

/** Apply theme on <html> — drives full app light/dark via CSS variables. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

/** Accent — Add Task button, badges, active nav. Does NOT change page light/dark. */
export function applyAccent(label: AccentColor, theme: Theme = currentThemeMode()) {
  const root = document.documentElement;

  if (label === 'Black') {
    root.style.removeProperty('--btn-primary-bg');
    root.style.removeProperty('--btn-primary-fg');
    root.style.setProperty('--accent-color', theme === 'dark' ? '#ededed' : '#171717');
    root.style.setProperty('--accent', theme === 'dark' ? '#ededed' : '#171717');
    return;
  }

  const hex = ACCENT_HEX[label] ?? ACCENT_HEX.Black;
  root.style.setProperty('--accent-color', hex);
  root.style.setProperty('--accent', hex);
  root.style.setProperty('--btn-primary-bg', hex);
  root.style.setProperty('--btn-primary-fg', '#ffffff');
}

/** Reset to normal Figma default — call on login / logout. */
export function resetThemeToDefaults() {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;

  applyTheme(DEFAULT_THEME);
  applyAccent(DEFAULT_ACCENT, DEFAULT_THEME);

  /* Drop inline overrides so CSS :root defaults take over. */
  root.style.removeProperty('--btn-primary-bg');
  root.style.removeProperty('--btn-primary-fg');
  root.style.removeProperty('--accent-color');
  root.style.removeProperty('--accent');

  try {
    localStorage.removeItem(THEME_KEY);
    localStorage.removeItem(ACCENT_KEY);
  } catch {
    /* private browsing */
  }

  window.dispatchEvent(new Event(THEME_RESET_EVENT));
}

function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  return stored === 'dark' ? 'dark' : DEFAULT_THEME;
}

function readStoredAccent(): AccentColor {
  if (typeof window === 'undefined') return DEFAULT_ACCENT;
  const stored = localStorage.getItem(ACCENT_KEY) as AccentColor | null;
  if (!stored || !(stored in ACCENT_HEX)) return DEFAULT_ACCENT;
  return stored;
}

function isLoginPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return path === '/' || path === '/login';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [accentColor, setAccentState] = useState<AccentColor>(DEFAULT_ACCENT);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (isLoginPath()) {
      resetThemeToDefaults();
      setThemeState(DEFAULT_THEME);
      setAccentState(DEFAULT_ACCENT);
    } else {
      const storedTheme = readStoredTheme();
      const storedAccent = readStoredAccent();
      setThemeState(storedTheme);
      setAccentState(storedAccent);
      applyTheme(storedTheme);
      applyAccent(storedAccent, storedTheme);
    }
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    const syncDefaults = () => {
      setThemeState(DEFAULT_THEME);
      setAccentState(DEFAULT_ACCENT);
      applyTheme(DEFAULT_THEME);
      applyAccent(DEFAULT_ACCENT, DEFAULT_THEME);
    };
    window.addEventListener(THEME_RESET_EVENT, syncDefaults);
    return () => window.removeEventListener(THEME_RESET_EVENT, syncDefaults);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    applyAccent(accentColor, next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private browsing */
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const setAccentColor = (next: AccentColor) => {
    setAccentState(next);
    applyAccent(next, theme);
    try {
      localStorage.setItem(ACCENT_KEY, next);
    } catch {
      /* private browsing */
    }
  };

  const resetToDefaults = () => {
    resetThemeToDefaults();
    setThemeState(DEFAULT_THEME);
    setAccentState(DEFAULT_ACCENT);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, accentColor, setAccentColor, resetToDefaults, ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
