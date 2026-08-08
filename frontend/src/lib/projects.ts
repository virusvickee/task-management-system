export interface Project {
  id: string;
  name: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
  lead: string;
  dueDate: string | null;
}

export const SEED_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Inventory System Revamp',     priority: 'High',        lead: 'Ankit Dutta',  dueDate: '2026-09-15' },
  { id: 'proj-2', name: 'Sales Dashboard v2',           priority: 'Urgent',      lead: 'Priya Sharma', dueDate: '2026-08-31' },
  { id: 'proj-3', name: 'API Documentation',            priority: 'Medium',      lead: 'Raj Mehta',    dueDate: '2026-10-01' },
  { id: 'proj-4', name: 'Mobile App Redesign',          priority: 'Low',         lead: 'Sara Lee',     dueDate: null },
  { id: 'proj-5', name: 'Auth & Permissions Overhaul',  priority: 'High',        lead: 'Ankit Dutta',  dueDate: '2026-09-05' },
];
