'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerPopoverProps {
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function parseDateString(str: string | null): Date | null {
  if (!str) return null;
  const clean = str.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateToYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatPillDate(dateStr: string | null): string | null {
  const parsed = parseDateString(dateStr);
  if (!parsed) return null;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(dateStr: string | null): string | null {
  const parsed = parseDateString(dateStr);
  if (!parsed) return null;
  return parsed.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DatePickerPopover({
  selectedDate,
  onSelectDate,
  onClose,
  anchorRef,
}: DatePickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const initialDate = parseDateString(selectedDate) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    // Use the passed anchorRef (trigger button) to position the popover
    const anchor = anchorRef?.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      setPosition({
        top: Math.min(rect.bottom + 6, window.innerHeight - 270),
        left: Math.max(8, Math.min(rect.left + rect.width / 2 - 100, window.innerWidth - 216)),
      });
    }
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', { month: 'long' });

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: Array<{
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateStr: string;
  }> = [];

  // Leading days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    const d = new Date(prevY, prevM, dayNum);
    days.push({
      day: dayNum,
      month: prevM,
      year: prevY,
      isCurrentMonth: false,
      dateStr: formatDateToYYYYMMDD(d),
    });
  }

  // Current month days
  for (let i = 1; i <= daysInCurrentMonth; i++) {
    const d = new Date(viewYear, viewMonth, i);
    days.push({
      day: i,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
      dateStr: formatDateToYYYYMMDD(d),
    });
  }

  // Trailing days for next month
  const totalCells = days.length <= 35 && days.length + (7 - (days.length % 7 || 7)) <= 35 ? 35 : 42;
  const neededTrailing = totalCells - days.length;

  for (let i = 1; i <= neededTrailing; i++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    const d = new Date(nextY, nextM, i);
    days.push({
      day: i,
      month: nextM,
      year: nextY,
      isCurrentMonth: false,
      dateStr: formatDateToYYYYMMDD(d),
    });
  }

  const todayStr = formatDateToYYYYMMDD(new Date());
  const parsedSelected = parseDateString(selectedDate);
  const selectedDateStr = parsedSelected ? formatDateToYYYYMMDD(parsedSelected) : null;

  return (
    <div
      className="calendar-popover fixed z-[9999]"
      style={position ? ({ top: `${position.top}px`, left: `${position.left}px` } as CSSProperties) : { top: '-9999px', left: '-9999px' }}
    >
      <div
        ref={popoverRef}
        className="w-[220px] h-[260px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-md shadow-[0_12px_36px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.4)] p-3 select-none flex flex-col gap-3"
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <span className="text-[15px] font-medium text-black dark:text-gray-100">
            {monthName} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
            aria-label="Next month"
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <span key={day} className="text-[11px] font-normal text-gray-500 dark:text-gray-400">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1.5 justify-items-center flex-1 content-between">
          {days.map((item, index) => {
            const isSelected = selectedDateStr === item.dateStr;
            const isToday = todayStr === item.dateStr;

            let dayClass =
              'w-7 h-7 text-[12px] flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20';

            if (isSelected) {
              dayClass += ' bg-black text-white font-medium dark:bg-white dark:text-black';
            } else if (isToday) {
              dayClass += ' bg-gray-100 text-black font-normal hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700';
            } else if (item.isCurrentMonth) {
              dayClass += ' text-black font-normal hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800';
            } else {
              dayClass += ' text-gray-400 font-normal hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-gray-800';
            }

            return (
              <button
                key={`${item.dateStr}-${index}`}
                type="button"
                onClick={() => {
                  if (!item.isCurrentMonth) {
                    setViewMonth(item.month);
                    setViewYear(item.year);
                  }
                  onSelectDate(item.dateStr);
                  onClose();
                }}
                className={dayClass}
              >
                {item.day}
              </button>
            );
          })}
        </div>
      </div>
    </div>

  );
}
