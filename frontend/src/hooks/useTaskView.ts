'use client';

import { useLayoutEffect, useState } from 'react';

export type TaskView = 'Board' | 'List';

export function useTaskView() {
  const [view, setView] = useState<TaskView>('Board');

  useLayoutEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setView('List');
    }
  }, []);

  return { view, setView };
}
