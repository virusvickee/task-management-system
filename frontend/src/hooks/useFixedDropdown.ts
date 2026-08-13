'use client';

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

const MOBILE_BREAKPOINT = 1023;

export function useFixedDropdownStyle(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  panelWidth: number,
) {
  const [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle({ visibility: 'hidden' });
      return;
    }

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const horizontalPadding = isMobile ? 12 : 8;
      const rightPadding = isMobile ? 12 : horizontalPadding;

      const effectiveWidth = Math.min(panelWidth, window.innerWidth - horizontalPadding - rightPadding);
      const maxLeft = window.innerWidth - effectiveWidth - rightPadding;

      let left: number;
      if (isMobile) {
        left = Math.max(horizontalPadding, Math.min(rect.left, maxLeft));
      } else {
        left = Math.max(horizontalPadding, Math.min(rect.right - effectiveWidth, maxLeft));
      }

      const top = rect.bottom + 6;
      const bottomPadding = isMobile ? 72 : horizontalPadding;
      const maxHeight = Math.max(160, window.innerHeight - top - bottomPadding);

      setStyle({
        position: 'fixed',
        top,
        left,
        width: effectiveWidth,
        maxHeight,
        zIndex: 9999,
        visibility: 'visible',
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef, panelWidth]);

  return style;
}
