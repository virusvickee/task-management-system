'use client';

import { useEffect, useRef, type RefObject } from 'react';

const SWIPE_THRESHOLD = 56;

export function useSwipeToClose(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled: boolean,
) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const onTouchStart = (event: TouchEvent) => {
      startX.current = event.touches[0].clientX;
      startY.current = event.touches[0].clientY;
      tracking.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking.current) return;

      const deltaX = event.touches[0].clientX - startX.current;
      const deltaY = Math.abs(event.touches[0].clientY - startY.current);

      if (deltaY > Math.abs(deltaX)) {
        tracking.current = false;
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!tracking.current) return;
      tracking.current = false;

      const deltaX = event.changedTouches[0].clientX - startX.current;
      if (deltaX < -SWIPE_THRESHOLD) {
        onClose();
      }
    };

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [ref, onClose, enabled]);
}
