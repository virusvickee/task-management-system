'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerPopoverProps {
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
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

export default function DatePickerPopover({
  selectedDate,
  onSelectDate,
  onClose,
}: DatePickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const initialDate = parseDateString(selectedDate) || new Date();
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
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
    <div className="fixed inset-0 sm:absolute sm:inset-auto sm:-left-12 sm:top-full z-50 flex items-center justify-center sm:block p-4 sm:p-0 sm:mt-2 bg-black/20 sm:bg-transparent">
      <div
        ref={popoverRef}
        className="w-[280px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200/80 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-4 select-none"
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3 px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-medium text-gray-900">
            {monthName} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <span key={day} className="text-[13px] font-normal text-gray-400 py-0.5">
              {day}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1.5 justify-items-center">
          {days.map((item, index) => {
            const isSelected = selectedDateStr === item.dateStr;
            const isToday = todayStr === item.dateStr;

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
                className={`w-9 h-9 text-[14px] font-normal flex items-center justify-center rounded-full transition-colors ${
                  isSelected
                    ? 'text-white font-medium shadow-sm'
                    : isToday
                    ? 'bg-gray-100 text-gray-900 font-medium hover:bg-gray-200'
                    : item.isCurrentMonth
                    ? 'text-gray-900 hover:bg-gray-100'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                style={isSelected ? { backgroundColor: 'var(--accent-color)' } : undefined}
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
