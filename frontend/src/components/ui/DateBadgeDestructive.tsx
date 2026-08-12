// src/components/ui/DateBadgeDestructive.tsx
"use client";

import { Calendar, LucideIcon } from "lucide-react";
import React from "react";

type DateBadgeDestructiveProps = {
  /** Show left icon – true by default */
  showLeftIcon?: boolean;
  /** Show right icon – false by default */
  showRightIcon?: boolean;
  /** Text displayed inside the badge – default "29 Jul" */
  badgeText?: string;
  /** Optional custom icon component – defaults to Calendar */
  Icon?: LucideIcon;
};

/**
 * Date badge with the destructive styling variant.
 *
 * Design tokens (matching the specification):
 *   - width: 67px, height: 20px
 *   - rounded‑3xl, border‑width (default), gap‑4
 *   - padding: pt‑0.5, pb‑0.5, pr‑2, pl‑2
 *   - background: var(--custom‑destructive‑10‑dark‑destructive‑20, rgba(220,38,38,0.1))
 *   - border‑top: 1px solid var(--tailwind‑colors‑base‑transparent, rgba(255,255,255,1))
 *   - optional left/right Lucide icons (Calendar default)
 */
export default function DateBadgeDestructive({
  showLeftIcon = true,
  showRightIcon = false,
  badgeText = "29 Jul",
  Icon = Calendar,
}: DateBadgeDestructiveProps) {
  const containerStyle: React.CSSProperties = {
    background: "var(--custom-destructive-10-dark-destructive-20, rgba(220, 38, 38, 0.1))",
    width: "66px",
    height: "20px",
    gap: "4px",
    padding: "2px 8px",
  };

  return (
    <div
      className="flex items-center justify-center rounded-3xl border border-red-200/60 dark:border-red-900/50"
      style={containerStyle}
    >
      {showLeftIcon && <Icon size={11} className="text-red-600 dark:text-red-400 shrink-0" />}
      <span className="text-[11px] font-medium text-red-700 dark:text-red-300 whitespace-nowrap leading-none mt-[1px]">{badgeText}</span>
      {showRightIcon && <Icon size={11} className="text-red-600 dark:text-red-400 shrink-0" />}
    </div>
  );
}
