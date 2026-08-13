'use client';

import { useEffect } from 'react';
import { applyAccent, applyTheme, isLoginPath, useTheme } from '@/context/theme-context';

/** Keeps <html> theme/accent tokens in sync after hydration and on every change. */
export function ThemeApplier() {
  const { theme, accentColor, ready } = useTheme();

  useEffect(() => {
    if (!ready || isLoginPath()) return;
    applyTheme(theme);
    applyAccent(accentColor, theme);
  }, [theme, accentColor, ready]);

  return null;
}
