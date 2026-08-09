// src/components/ui/ParentContainer.tsx
"use client";

import React, { ReactNode } from "react";

type ParentContainerProps = {
  /** Content to be rendered inside the container */
  children?: ReactNode;
  /** Optional additional class names */
  className?: string;
  /** Optional inline style overrides */
  style?: React.CSSProperties;
};

/**
 * A generic parent container matching the exact design tokens provided:
 *   - width: 273px; height: 114px
 *   - rounded‑md corners
 *   - 1px solid border using the `--base-border` CSS variable
 *   - gap between children: 8px
 *   - padding: spacing/3 (Tailwind `p-3`)
 *   - background using `--base-background`
 *   - no rotation or opacity changes (defaults)
 *
 * The component simply renders its children inside a styled `div`.
 */
export default function ParentContainer({
  children,
  className = "",
  style = {},
}: ParentContainerProps) {
  const containerStyle: React.CSSProperties = {
    width: "273px",
    height: "114px",
    background: "var(--base-background, rgba(255, 255, 255, 1))",
    border: "1px solid var(--base-border, rgba(229, 229, 229, 1))",
    ...style,
  };

  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-md border ${className}`}
      style={containerStyle}
    >
      {children}
    </div>
  );
}
