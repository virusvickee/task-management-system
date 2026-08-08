'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-3 select-none ${className || ''}`}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center text-sm font-medium text-gray-900',
        caption_label: 'text-sm font-medium text-gray-900',
        nav: 'space-x-1 flex items-center',
        button_previous:
          'absolute left-1 h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors',
        button_next:
          'absolute right-1 h-7 w-7 bg-transparent p-0 text-gray-500 hover:text-gray-900 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex justify-between',
        weekday:
          'text-gray-400 rounded-md w-9 font-normal text-[0.8rem] text-center',
        week: 'flex w-full mt-2 justify-between',
        day: 'h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-full flex items-center justify-center text-[13px] text-gray-900 transition-colors',
        selected:
          'bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white rounded-full font-medium',
        today: 'bg-gray-100 text-gray-900 font-semibold',
        outside:
          'day-outside text-gray-300 opacity-50',
        disabled: 'text-gray-300 opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
