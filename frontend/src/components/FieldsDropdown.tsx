'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, LayoutGrid, List } from 'lucide-react';
import { useFixedDropdownStyle } from '@/hooks/useFixedDropdown';
import { useIsMobile } from '@/hooks/useIsMobile';
import MobileDropdownBackdrop from '@/components/MobileDropdownBackdrop';

const FIELD_OPTIONS: { key: string; label: string }[] = [
  { key: 'priority', label: 'Priority' },
  { key: 'members', label: 'Members' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'labels', label: 'Labels' },
  { key: 'status', label: 'Status' },
  { key: 'reporter', label: 'Reporter' },
];

interface Props {
  view?: 'List' | 'Board';
  onViewChange?: (v: 'List' | 'Board') => void;
  fields: Record<string, boolean>;
  onFieldsChange: (f: Record<string, boolean>) => void;
  showViewToggle?: boolean;
}

export default function FieldsDropdown({
  view = 'List',
  onViewChange,
  fields,
  onFieldsChange,
  showViewToggle = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelStyle = useFixedDropdownStyle(open, ref, isMobile ? 300 : 220);

  const closeDropdown = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function handler(e: PointerEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeDropdown();
    }
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

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

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {isMobile && <MobileDropdownBackdrop onClose={closeDropdown} />}
          <div
            ref={panelRef}
            className="fields-dropdown-panel toolbar-dropdown-panel app-toolbar-dropdown rounded-xl shadow-lg py-2 select-none"
            style={panelStyle}
          >
          {showViewToggle && onViewChange && (
            <>
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
            </>
          )}

          {FIELD_OPTIONS.map(({ key, label }) => {
            const checked = Boolean(fields[key]);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleField(key)}
                className="fields-dropdown-item app-dropdown-item w-full flex items-center justify-between gap-3 px-3 py-[9px] transition-colors"
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
        </>,
        document.body,
      )}
    </div>
  );
}
