'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check, LayoutGrid, List, ChevronRight,
  Circle, BarChart2, Users, Calendar, Tag, User,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────── */
export interface TaskFilters {
  priorities: string[];    // e.g. ['High', 'Medium']
  statuses:   string[];    // e.g. ['To Do', 'Doing']
  members:    string[];
  dueDateRange: string | null; // 'overdue' | 'today' | 'this_week' | 'no_date' | null
  labels:     string[];
  reporters:  string[];
}

export const EMPTY_FILTERS: TaskFilters = {
  priorities: [], statuses: [], members: [],
  dueDateRange: null, labels: [], reporters: [],
};

/* ─── Sub-option data ────────────────────────────────────── */
const PRIORITY_OPTIONS = [
  { label: 'No Priority', color: 'text-gray-400' },
  { label: 'Urgent',      color: 'text-red-600' },
  { label: 'High',        color: 'text-red-500' },
  { label: 'Medium',      color: 'text-orange-500' },
  { label: 'Low',         color: 'text-gray-400' },
];

const STATUS_OPTIONS = [
  { label: 'To Do',     dot: 'bg-amber-400' },
  { label: 'Doing',     dot: 'bg-blue-500' },
  { label: 'Completed', dot: 'bg-green-500' },
  { label: 'On Hold',   dot: 'bg-orange-400' },
];

const DUE_DATE_OPTIONS = [
  { label: 'Overdue',   value: 'overdue' },
  { label: 'Today',     value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'No date',   value: 'no_date' },
];

const LABEL_OPTIONS  = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
const MEMBER_OPTIONS = ['Ankit Dutta', 'Priya Sharma', 'Raj Mehta', 'Sara Lee'];
const REPORTER_OPTIONS = ['You', 'Ankit Dutta', 'Priya Sharma'];

/* ─── Field config ───────────────────────────────────────── */
type FieldKey = 'status' | 'priority' | 'members' | 'dueDate' | 'labels' | 'reporter';

const FIELDS: { key: FieldKey; label: string; Icon: React.ElementType }[] = [
  { key: 'status',   label: 'Status',   Icon: Circle },
  { key: 'priority', label: 'Priority', Icon: BarChart2 },
  { key: 'members',  label: 'Members',  Icon: Users },
  { key: 'dueDate',  label: 'Due Date', Icon: Calendar },
  { key: 'labels',   label: 'Labels',   Icon: Tag },
  { key: 'reporter', label: 'Reporter', Icon: User },
];

/* ─── Helper: count active filters for a field ──────────── */
function badgeCount(field: FieldKey, filters: TaskFilters): number {
  if (field === 'priority') return filters.priorities.length;
  if (field === 'status')   return filters.statuses.length;
  if (field === 'members')  return filters.members.length;
  if (field === 'dueDate')  return filters.dueDateRange ? 1 : 0;
  if (field === 'labels')   return filters.labels.length;
  if (field === 'reporter') return filters.reporters.length;
  return 0;
}

/* ─── Generic multi-select submenu ──────────────────────── */
function MultiSelectSubmenu({
  options,
  selected,
  onToggle,
  renderOption,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  renderOption?: (v: string) => React.ReactNode;
}) {
  return (
    <div className="absolute left-full top-0 ml-1 min-w-[180px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
        >
          {renderOption ? renderOption(opt) : <span className="flex-1 text-left">{opt}</span>}
          {selected.includes(opt) && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
        </button>
      ))}
    </div>
  );
}

/* ─── Main FieldsDropdown ────────────────────────────────── */
interface Props {
  view: 'List' | 'Board';
  onViewChange: (v: 'List' | 'Board') => void;
  fields: Record<string, boolean>;
  onFieldsChange: (f: Record<string, boolean>) => void;
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
}

export default function FieldsDropdown({
  view, onViewChange, filters, onFiltersChange,
}: Props) {
  const [open, setOpen]       = useState(false);
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveField(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* generic multi-select toggle helpers */
  function togglePriority(v: string) {
    const arr = filters.priorities.includes(v)
      ? filters.priorities.filter((x) => x !== v)
      : [...filters.priorities, v];
    onFiltersChange({ ...filters, priorities: arr });
  }
  function toggleStatus(v: string) {
    const arr = filters.statuses.includes(v)
      ? filters.statuses.filter((x) => x !== v)
      : [...filters.statuses, v];
    onFiltersChange({ ...filters, statuses: arr });
  }
  function toggleMember(v: string) {
    const arr = filters.members.includes(v)
      ? filters.members.filter((x) => x !== v)
      : [...filters.members, v];
    onFiltersChange({ ...filters, members: arr });
  }
  function toggleLabel(v: string) {
    const arr = filters.labels.includes(v)
      ? filters.labels.filter((x) => x !== v)
      : [...filters.labels, v];
    onFiltersChange({ ...filters, labels: arr });
  }
  function toggleReporter(v: string) {
    const arr = filters.reporters.includes(v)
      ? filters.reporters.filter((x) => x !== v)
      : [...filters.reporters, v];
    onFiltersChange({ ...filters, reporters: arr });
  }
  function setDueDate(v: string) {
    onFiltersChange({
      ...filters,
      dueDateRange: filters.dueDateRange === v ? null : v,
    });
  }

  /* total active filter count for trigger badge */
  const totalActive =
    filters.priorities.length + filters.statuses.length + filters.members.length +
    (filters.dueDateRange ? 1 : 0) + filters.labels.length + filters.reporters.length;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => { setOpen((v) => !v); setActiveField(null); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium border rounded-lg transition-colors ${
          open || totalActive > 0
            ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200'
            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <rect x="0" y="1"    width="13" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="0" y="5.75" width="13" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="0" y="10.5" width="13" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
        Fields
        {totalActive > 0 && (
          <span
            className="ml-0.5 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            {totalActive}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[220px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 py-2">
          {/* View toggle */}
          <div className="mx-2 mb-2 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex">
            {(['List', 'Board'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onViewChange(t)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  view === t
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t === 'List' ? <List size={12} /> : <LayoutGrid size={12} />}
                {t}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-2 mb-1 border-t border-gray-100 dark:border-gray-800" />

          {/* Field rows */}
          {FIELDS.map(({ key, label, Icon }) => {
            const count = badgeCount(key, filters);
            const isActive = activeField === key;
            return (
              <div key={key} className="relative">
                <button
                  onMouseEnter={() => setActiveField(key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-[9px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                >
                  <Icon size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="flex-1 text-left text-[13px] text-gray-700 dark:text-gray-300">{label}</span>
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronRight size={13} className="text-gray-400 shrink-0" />
                </button>

                {/* ── Priority submenu ── */}
                {isActive && key === 'priority' && (
                  <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => togglePriority(p.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                      >
                        <BarChart2 size={13} className={`${p.color} shrink-0`} />
                        <span className="flex-1 text-left">{p.label}</span>
                        {filters.priorities.includes(p.label) && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Status submenu ── */}
                {isActive && key === 'status' && (
                  <div className="absolute left-full top-0 ml-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => toggleStatus(s.label)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
                        <span className="flex-1 text-left">{s.label}</span>
                        {filters.statuses.includes(s.label) && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Members submenu ── */}
                {isActive && key === 'members' && (
                  <MultiSelectSubmenu
                    options={MEMBER_OPTIONS}
                    selected={filters.members}
                    onToggle={toggleMember}
                    renderOption={(v) => (
                      <>
                        <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {v.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                        </span>
                        <span className="flex-1 text-left">{v}</span>
                      </>
                    )}
                  />
                )}

                {/* ── Due Date submenu ── */}
                {isActive && key === 'dueDate' && (
                  <div className="absolute left-full top-0 ml-1 w-[160px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
                    {DUE_DATE_OPTIONS.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDueDate(d.value)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                      >
                        <Calendar size={13} className="text-gray-400 shrink-0" />
                        <span className="flex-1 text-left">{d.label}</span>
                        {filters.dueDateRange === d.value && <Check size={12} className="text-gray-900 dark:text-gray-100 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Labels submenu ── */}
                {isActive && key === 'labels' && (
                  <MultiSelectSubmenu
                    options={LABEL_OPTIONS}
                    selected={filters.labels}
                    onToggle={toggleLabel}
                  />
                )}

                {/* ── Reporter submenu ── */}
                {isActive && key === 'reporter' && (
                  <MultiSelectSubmenu
                    options={REPORTER_OPTIONS}
                    selected={filters.reporters}
                    onToggle={toggleReporter}
                  />
                )}
              </div>
            );
          })}

          {/* Clear all */}
          {totalActive > 0 && (
            <>
              <div className="mx-2 mt-1 border-t border-gray-100 dark:border-gray-800" />
              <button
                onClick={() => onFiltersChange({ ...EMPTY_FILTERS })}
                className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 py-2 transition-colors"
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
