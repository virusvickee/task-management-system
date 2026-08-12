'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check, ChevronRight, Filter,
  Circle, BarChart2, Users, Calendar, Tag, User,
} from 'lucide-react';
import { RiTeamLine } from 'react-icons/ri';
import PriorityBars, { priorityTextColor } from '@/components/ui/PriorityBars';
import type { Priority } from '@/lib/priority';

export interface TaskFilters {
  priorities: string[];
  statuses: string[];
  members: string[];
  dueDateRange: string | null;
  labels: string[];
  reporters: string[];
  teams: string[];
}

export const EMPTY_FILTERS: TaskFilters = {
  priorities: [],
  statuses: [],
  members: [],
  dueDateRange: null,
  labels: [],
  reporters: [],
  teams: [],
};

const PRIORITY_OPTIONS: Priority[] = [
  'No Priority', 'Urgent', 'High', 'Medium', 'Low',
];

const STATUS_OPTIONS = [
  { label: 'To Do', dot: 'bg-amber-400' },
  { label: 'Doing', dot: 'bg-blue-500' },
  { label: 'Completed', dot: 'bg-green-500' },
  { label: 'On Hold', dot: 'bg-orange-400' },
];

const DUE_DATE_OPTIONS = [
  { label: 'Overdue', value: 'overdue' },
  { label: 'Today', value: 'today' },
  { label: 'This week', value: 'this_week' },
  { label: 'No date', value: 'no_date' },
];

const LABEL_OPTIONS = ['Research', 'Design', 'Development', 'Testing', 'Deployment'];
const MEMBER_OPTIONS = ['Ankit Dutta', 'Priya Sharma', 'Raj Mehta', 'Sara Lee'];
const TEAM_OPTIONS = ['Design', 'Engineering', 'Product', 'QA'];
const REPORTER_OPTIONS = ['You', 'Ankit Dutta', 'Priya Sharma'];

type FilterKey = 'status' | 'priority' | 'members' | 'dueDate' | 'teams' | 'labels' | 'reporter';

const FILTER_FIELDS: {
  key: FilterKey;
  label: string;
  Icon: React.ElementType;
}[] = [
  { key: 'status', label: 'Status', Icon: Circle },
  { key: 'priority', label: 'Priority', Icon: BarChart2 },
  { key: 'members', label: 'Members', Icon: Users },
  { key: 'dueDate', label: 'Due Date', Icon: Calendar },
  { key: 'teams', label: 'Teams', Icon: RiTeamLine },
  { key: 'labels', label: 'Labels', Icon: Tag },
  { key: 'reporter', label: 'Reporter', Icon: User },
];

function badgeCount(field: FilterKey, filters: TaskFilters): number {
  if (field === 'priority') return filters.priorities.length;
  if (field === 'status') return filters.statuses.length;
  if (field === 'members') return filters.members.length;
  if (field === 'dueDate') return filters.dueDateRange ? 1 : 0;
  if (field === 'teams') return filters.teams.length;
  if (field === 'labels') return filters.labels.length;
  if (field === 'reporter') return filters.reporters.length;
  return 0;
}

function FilterSubmenu({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="filter-dropdown-submenu fields-dropdown-panel absolute top-0 right-full mr-1 min-w-[168px] rounded-xl shadow-lg py-1.5 z-[10000] select-none">
      <p className="filter-dropdown-submenu-header">{title}</p>
      {children}
    </div>
  );
}

function SubmenuOption({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fields-dropdown-item w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors rounded-lg mx-0"
    >
      {children}
      {selected && <Check size={12} className="shrink-0 ml-auto text-[var(--base-primary)]" />}
    </button>
  );
}

interface Props {
  filters: TaskFilters;
  onFiltersChange: (f: TaskFilters) => void;
  ariaLabel?: string;
}

export default function FilterDropdown({ filters, onFiltersChange, ariaLabel = 'Filter' }: Props) {
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<FilterKey | null>(null);
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

  function toggleInArray(field: keyof TaskFilters, value: string) {
    const current = filters[field];
    if (!Array.isArray(current)) return;
    const arr = current.includes(value)
      ? current.filter((x) => x !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [field]: arr });
  }

  function setDueDate(v: string) {
    onFiltersChange({
      ...filters,
      dueDateRange: filters.dueDateRange === v ? null : v,
    });
  }

  const totalActive =
    filters.priorities.length +
    filters.statuses.length +
    filters.members.length +
    (filters.dueDateRange ? 1 : 0) +
    filters.teams.length +
    filters.labels.length +
    filters.reporters.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setActiveField(null);
        }}
        className="dashboard-toolbar-icon-btn relative"
        data-state={open ? 'open' : 'closed'}
        data-active={totalActive > 0 ? 'true' : 'false'}
        aria-label={ariaLabel}
      >
        <Filter size={14} strokeWidth={1.75} className="dashboard-toolbar-icon" />
        {totalActive > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            {totalActive}
          </span>
        )}
      </button>

      {open && (
        <div className="filter-dropdown-panel fields-dropdown-panel absolute right-0 top-full mt-1.5 w-[200px] rounded-xl shadow-lg z-[9999] py-1.5 select-none">
          {FILTER_FIELDS.map(({ key, label, Icon }) => {
            const count = badgeCount(key, filters);
            const isActive = activeField === key;
            return (
              <div key={key} className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setActiveField(key)}
                  className={`fields-dropdown-item w-full flex items-center gap-2.5 px-3 py-[9px] transition-colors${isActive ? ' fields-dropdown-item--active' : ''}`}
                >
                  <Icon
                    size={key === 'teams' ? 16 : 14}
                    className={`fields-dropdown-item-icon shrink-0${key === 'teams' ? ' teams-icon' : ''}`}
                  />
                  <span className="flex-1 text-left text-[13px]">{label}</span>
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--accent-color)' }}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronRight size={13} className="fields-dropdown-item-icon shrink-0" />
                </button>

                {isActive && key === 'priority' && (
                  <FilterSubmenu title="Priority">
                    {PRIORITY_OPTIONS.map((p) => (
                      <SubmenuOption
                        key={p}
                        selected={filters.priorities.includes(p)}
                        onClick={() => toggleInArray('priorities', p)}
                      >
                        <PriorityBars priority={p} size={13} />
                        <span className={`flex-1 text-left ${priorityTextColor(p)}`}>{p}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'status' && (
                  <FilterSubmenu title="Status">
                    {STATUS_OPTIONS.map((s) => (
                      <SubmenuOption
                        key={s.label}
                        selected={filters.statuses.includes(s.label)}
                        onClick={() => toggleInArray('statuses', s.label)}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`} />
                        <span className="flex-1 text-left">{s.label}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'members' && (
                  <FilterSubmenu title="Members">
                    {MEMBER_OPTIONS.map((m) => (
                      <SubmenuOption
                        key={m}
                        selected={filters.members.includes(m)}
                        onClick={() => toggleInArray('members', m)}
                      >
                        <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {m.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                        </span>
                        <span className="flex-1 text-left">{m}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'dueDate' && (
                  <FilterSubmenu title="Due Date">
                    {DUE_DATE_OPTIONS.map((d) => (
                      <SubmenuOption
                        key={d.value}
                        selected={filters.dueDateRange === d.value}
                        onClick={() => setDueDate(d.value)}
                      >
                        <Calendar size={13} className="fields-dropdown-item-icon shrink-0" />
                        <span className="flex-1 text-left">{d.label}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'teams' && (
                  <FilterSubmenu title="Teams">
                    {TEAM_OPTIONS.map((t) => (
                      <SubmenuOption
                        key={t}
                        selected={filters.teams.includes(t)}
                        onClick={() => toggleInArray('teams', t)}
                      >
                        <RiTeamLine size={16} className="teams-icon fields-dropdown-item-icon shrink-0" />
                        <span className="flex-1 text-left">{t}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'labels' && (
                  <FilterSubmenu title="Labels">
                    {LABEL_OPTIONS.map((l) => (
                      <SubmenuOption
                        key={l}
                        selected={filters.labels.includes(l)}
                        onClick={() => toggleInArray('labels', l)}
                      >
                        <Tag size={13} className="fields-dropdown-item-icon shrink-0" />
                        <span className="flex-1 text-left">{l}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}

                {isActive && key === 'reporter' && (
                  <FilterSubmenu title="Reporter">
                    {REPORTER_OPTIONS.map((r) => (
                      <SubmenuOption
                        key={r}
                        selected={filters.reporters.includes(r)}
                        onClick={() => toggleInArray('reporters', r)}
                      >
                        <User size={13} className="fields-dropdown-item-icon shrink-0" />
                        <span className="flex-1 text-left">{r}</span>
                      </SubmenuOption>
                    ))}
                  </FilterSubmenu>
                )}
              </div>
            );
          })}

          {totalActive > 0 && (
            <>
              <div className="fields-dropdown-divider mx-2 mt-1" />
              <button
                type="button"
                onClick={() => onFiltersChange({ ...EMPTY_FILTERS })}
                className="fields-dropdown-item fields-dropdown-item-icon w-full text-center text-[12px] py-2 transition-colors"
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
