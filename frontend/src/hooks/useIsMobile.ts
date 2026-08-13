'use client';

import { useLayoutEffect, useState } from 'react';

export function useIsMobile(breakpoint = 1023) {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [breakpoint]);

  return isMobile;
}
