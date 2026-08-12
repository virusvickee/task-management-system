'use client';

import { useEffect, useRef } from 'react';

/** Opens page search on ⌘F (Mac) / Ctrl+F (Windows). */
export function useSearchShortcut(focusSearch: () => void) {
  const focusSearchRef = useRef(focusSearch);
  focusSearchRef.current = focusSearch;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'f' || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      focusSearchRef.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
