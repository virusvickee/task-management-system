'use client';

import type { Priority } from '@/lib/priority';

const CONFIG: Record<Priority, { bars: number; color: string; textColor: string }> = {
  'No Priority': { bars: 0, color: 'bg-gray-300 dark:bg-gray-600', textColor: 'text-gray-400 dark:text-gray-500' },
  Urgent: { bars: 4, color: 'bg-red-500 dark:bg-red-400', textColor: 'text-red-600 dark:text-red-400' },
  High: { bars: 3, color: 'bg-red-500 dark:bg-red-400', textColor: 'text-red-600 dark:text-red-400' },
  Medium: { bars: 2, color: 'bg-amber-400 dark:bg-amber-400', textColor: 'text-amber-500 dark:text-amber-400' },
  Low: { bars: 1, color: 'bg-gray-300 dark:bg-gray-600', textColor: 'text-gray-400 dark:text-gray-500' },
};

export function priorityTextColor(priority: Priority) {
  return CONFIG[priority]?.textColor ?? CONFIG['No Priority'].textColor;
}

export default function PriorityBars({
  priority,
  size = 12,
  className = '',
}: {
  priority: Priority;
  size?: number;
  className?: string;
}) {
  const config = CONFIG[priority] ?? CONFIG['No Priority'];

  if (config.bars === 0) {
    return (
      <span
        className={`inline-block rounded-full ${config.color} shrink-0 ${className}`}
        style={{ width: size * 0.35, height: size * 0.35 }}
      />
    );
  }

  const barWidth = Math.max(2, Math.round(size * 0.18));
  const gap = Math.max(1, Math.round(size * 0.12));
  const heights = [0.45, 0.65, 0.85, 1].map((ratio) => Math.round(size * ratio));

  return (
    <span className={`inline-flex items-end shrink-0 ${className}`} style={{ height: size, gap }}>
      {heights.slice(4 - config.bars).map((height, index) => (
        <span
          key={index}
          className={`rounded-[1px] ${config.color}`}
          style={{ width: barWidth, height }}
        />
      ))}
    </span>
  );
}
