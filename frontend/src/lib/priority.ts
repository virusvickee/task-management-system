export type Priority = 'No Priority' | 'Urgent' | 'High' | 'Medium' | 'Low';

export const PRIORITIES: { label: Priority; textColor: string }[] = [
  { label: 'No Priority', textColor: 'text-gray-400 dark:text-gray-500' },
  { label: 'Urgent', textColor: 'text-red-600 dark:text-red-400' },
  { label: 'High', textColor: 'text-red-600 dark:text-red-400' },
  { label: 'Medium', textColor: 'text-amber-500 dark:text-amber-400' },
  { label: 'Low', textColor: 'text-gray-400 dark:text-gray-500' },
];

export function displayStatus(status: string) {
  if (status === 'To Do') return 'Backlog';
  return status;
}

export const STATUS_DOTS: Record<string, string> = {
  'To Do': 'bg-orange-400',
  Backlog: 'bg-orange-400',
  Doing: 'bg-blue-500',
  Completed: 'bg-green-500',
  'On Hold': 'bg-orange-400',
};
