'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, LayoutGrid, List } from 'lucide-react';

const FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'members', label: 'Members' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'labels', label: 'Labels' },
  { key: 'status', label: 'Status' },
  { key: 'reporter', label: 'Reporter' },
];

interface Props {
  view: 'List' | 'Board';
  onViewChange: (v: 'List' | 'Board') => void;
  fields: Record<string, boolean>;
  onFieldsChange: (f: Record<string, boolean>) => void;
}

export default function FieldsDropdown({
  view,
  onViewChange,
  fields,
  onFieldsChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function toggleField(key: string) {
    onFieldsChange({ ...fields, [key]: !fields[key] });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="dashboard-toolbar-fields-btn"
        data-state={open ? 'open' : 'closed'}
      >
        <svg
          className="dashboard-toolbar-fields-icon dashboard-toolbar-icon"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="1.375"
            y="1.375"
            width="11.25"
            height="11.25"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.75"
          />
          <path
            d="M5.08 3.25V10.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M8.92 3.25V10.75"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
        <span className="dashboard-toolbar-fields-label shrink-0">Fields</span>
      </button>

      {open && (
        <div className="fields-dropdown-panel absolute right-0 top-full mt-1.5 w-[220px] rounded-xl shadow-lg z-[9999] py-2 select-none">
          <div className="fields-dropdown-segment mx-2 mb-2 p-0.5 rounded-lg flex">
            {(['List', 'Board'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onViewChange(t)}
                className={`fields-dropdown-view-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium transition-all${view === t ? ' fields-dropdown-view-btn--active' : ''}`}
              >
                {t === 'List' ? <List size={12} /> : <LayoutGrid size={12} />}
                {t}
              </button>
            ))}
          </div>

          <div className="fields-dropdown-divider mx-2 mb-1" />

          {FIELD_OPTIONS.map(({ key, label }) => {
            const checked = Boolean(fields[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleField(key)}
                className="fields-dropdown-item w-full flex items-center justify-between gap-3 px-3 py-[9px] transition-colors"
              >
                <span className="text-[13px]">{label}</span>
                <span
                  className={`fields-dropdown-toggle shrink-0${checked ? ' fields-dropdown-toggle--on' : ' fields-dropdown-toggle--off'}`}
                  aria-hidden="true"
                >
                  {checked && <Check size={11} strokeWidth={2.5} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
