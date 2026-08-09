// src/components/ui/DateBadge.tsx
"use client";

import { Calendar, LucideIcon } from "lucide-react";
import React from "react";

type DateBadgeProps = {
  /** Visual variant – only "Destructive" is used in the design. */
  variant?: "Destructive";
  /** Current state – only "Default" is required for now. */
  state?: "Default";
  /** Show an icon on the left side of the text. */
  showLeftIcon?: boolean;
  /** Show an icon on the right side of the text. */
  showRightIcon?: boolean;
  /** Text displayed inside the badge. */
  badgeText?: string;
  /** Optional custom icon component – defaults to Calendar. */
  Icon?: LucideIcon;
};

/**
 * A compact date badge used throughout the app.
 * Design tokens:
 *   width: 67px; height: 20px;
 *   rounded-3xl; border-width default; gap-4;
 *   padding: pt-0.5 pb-0.5 pr-2 pl-2;
 *   background: var(--custom-destructive-10-dark-destructive-20, rgba(220,38,38,0.1));
 *   border-top: 1px solid var(--tailwind-colors-base-transparent, rgba(255,255,255,1));
 */
export default function DateBadge({
  variant = "Destructive",
  state = "Default",
  showLeftIcon = true,
  showRightIcon = false,
  badgeText = "29 Jul",
  Icon = Calendar,
}: DateBadgeProps) {
  const containerStyle: React.CSSProperties = {
    background: "var(--custom-destructive-10-dark-destructive-20, rgba(220, 38, 38, 0.1))",
    borderTop: "1px solid var(--tailwind-colors-base-transparent, rgba(255, 255, 255, 1))",
    width: "67px",
    height: "20px",
  };

  return (
    <div
      className="flex items-center justify-center gap-1 rounded-3xl border border-gray-200 dark:border-gray-700 pt-0.5 pb-0.5 pr-2 pl-2"
      style={containerStyle}
    >
      {showLeftIcon && <Icon size={11} className="text-gray-600 dark:text-gray-300 shrink-0" />}
      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap leading-none mt-[1px]">{badgeText}</span>
      {showRightIcon && <Icon size={11} className="text-gray-600 dark:text-gray-300 shrink-0" />}
    </div>
  );
}
