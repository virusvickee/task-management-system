'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

export type AccentColor = 'Amber' | 'Blue' | 'Pink' | 'Rose' | 'Emerald' | 'Black';

export const ACCENT_COLORS: { label: AccentColor; hex: string; swatch: string }[] = [
  { label: 'Amber',   hex: '#f59e0b', swatch: 'bg-amber-400' },
  { label: 'Blue',    hex: '#3b82f6', swatch: 'bg-blue-500' },
  { label: 'Pink',    hex: '#ec4899', swatch: 'bg-pink-500' },
  { label: 'Rose',    hex: '#f43f5e', swatch: 'bg-rose-500' },
  { label: 'Emerald', hex: '#10b981', swatch: 'bg-emerald-500' },
  { label: 'Black',   hex: '#171717', swatch: 'bg-gray-900' },
];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY  = 'tms-theme';
const ACCENT_KEY = 'tms-accent';

function applyAccent(label: AccentColor) {
  const entry = ACCENT_COLORS.find((c) => c.label === label);
  if (entry) document.documentElement.style.setProperty('--accent-color', entry.hex);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState]   = useState<Theme>('light');
  const [accentColor, setAccentState] = useState<AccentColor>('Black');

  // Hydrate from localStorage once mounted
  useEffect(() => {
    const storedTheme  = (localStorage.getItem(THEME_KEY)  as Theme | null) ?? 'light';
    let storedAccent   = (localStorage.getItem(ACCENT_KEY) as AccentColor | null) ?? 'Black';

    // Migration: 'Amber' was never the intended default — reset to 'Black'
    if (storedAccent === 'Amber') {
      storedAccent = 'Black';
      localStorage.setItem(ACCENT_KEY, 'Black');
    }

    setThemeState(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    setAccentState(storedAccent);
    applyAccent(storedAccent);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const setAccentColor = (next: AccentColor) => {
    setAccentState(next);
    localStorage.setItem(ACCENT_KEY, next);
    applyAccent(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
