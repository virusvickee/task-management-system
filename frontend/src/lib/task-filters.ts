import type { TaskFilters } from '@/components/FilterDropdown';
import type { Task } from '@/hooks/useTasks';
import { getStoredUserName } from '@/lib/api';

const MS_PER_DAY = 86400000;

function taskReporter(task: Task, currentUserName: string): string {
  return task.reporterName?.trim() || currentUserName;
}

function reporterMatchesFilter(
  task: Task,
  filterValues: string[],
  currentUserName: string,
): boolean {
  const reporter = taskReporter(task, currentUserName);
  return filterValues.some((value) => {
    if (value === 'You') return reporter === currentUserName;
    return reporter === value;
  });
}

export function matchesTaskFilters(
  task: Task,
  filters: TaskFilters,
  currentUserName = getStoredUserName(),
): boolean {
  if (filters.priorities.length > 0) {
    const taskPriority = task.priority || 'No Priority';
    if (!filters.priorities.includes(taskPriority)) return false;
  }

  if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
    return false;
  }

  if (filters.members.length > 0) {
    if (!task.assignee || !filters.members.includes(task.assignee)) return false;
  }

  if (filters.labels.length > 0) {
    const taskLabels = task.tags ?? [];
    if (!filters.labels.some((label) => taskLabels.includes(label))) return false;
  }

  if (filters.teams.length > 0) {
    if (!task.team || !filters.teams.includes(task.team)) return false;
  }

  if (filters.reporters.length > 0) {
    if (!reporterMatchesFilter(task, filters.reporters, currentUserName)) return false;
  }

  if (filters.dueDateRange) {
    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eod = new Date(sod.getTime() + MS_PER_DAY - 1);
    const eow = new Date(sod.getTime() + (7 - sod.getDay()) * MS_PER_DAY - 1);

    if (filters.dueDateRange === 'no_date' && due !== null) return false;
    if (filters.dueDateRange === 'overdue' && (!due || due >= sod)) return false;
    if (filters.dueDateRange === 'today' && (!due || due < sod || due > eod)) return false;
    if (filters.dueDateRange === 'this_week' && (!due || due < sod || due > eow)) return false;
  }

  return true;
}
