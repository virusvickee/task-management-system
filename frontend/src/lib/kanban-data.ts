export type Tag = { label: string };

export interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  avatarColor: string; // solid bg class
  dueDate: string;
  tags: Tag[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export const COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      {
        id: 't1',
        title: 'Design onboarding flow wireframes',
        assignee: 'Alex Kim',
        avatarColor: 'bg-violet-500',
        dueDate: 'Aug 14',
        tags: [{ label: 'Design' }, { label: 'UX' }],
      },
      {
        id: 't2',
        title: 'Write API documentation for v2 endpoints',
        assignee: 'Sam Lee',
        avatarColor: 'bg-emerald-500',
        dueDate: 'Aug 18',
        tags: [{ label: 'Docs' }],
      },
      {
        id: 't3',
        title: 'Set up CI/CD pipeline on GitHub Actions',
        assignee: 'Jordan Park',
        avatarColor: 'bg-pink-500',
        dueDate: 'Aug 20',
        tags: [{ label: 'DevOps' }, { label: 'Backend' }],
      },
    ],
  },
  {
    id: 'doing',
    title: 'Doing',
    tasks: [
      {
        id: 'd1',
        title: 'Implement JWT refresh token logic',
        assignee: 'Morgan Chen',
        avatarColor: 'bg-orange-500',
        dueDate: 'Aug 10',
        tags: [{ label: 'Backend' }, { label: 'Auth' }],
      },
      {
        id: 'd2',
        title: 'Build Kanban board UI components',
        assignee: 'Alex Kim',
        avatarColor: 'bg-violet-500',
        dueDate: 'Aug 12',
        tags: [{ label: 'Frontend' }],
      },
      {
        id: 'd3',
        title: 'Integrate Mongoose task schema with API',
        assignee: 'Sam Lee',
        avatarColor: 'bg-emerald-500',
        dueDate: 'Aug 11',
        tags: [{ label: 'Backend' }, { label: 'DB' }],
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    tasks: [
      {
        id: 'c1',
        title: 'Set up NestJS project scaffold',
        assignee: 'Sam Lee',
        avatarColor: 'bg-emerald-500',
        dueDate: 'Aug 5',
        tags: [{ label: 'Backend' }],
      },
      {
        id: 'c2',
        title: 'Configure Tailwind CSS and theme tokens',
        assignee: 'Jordan Park',
        avatarColor: 'bg-pink-500',
        dueDate: 'Aug 6',
        tags: [{ label: 'Frontend' }, { label: 'Design' }],
      },
      {
        id: 'c3',
        title: 'MongoDB schema design and indexing',
        assignee: 'Morgan Chen',
        avatarColor: 'bg-orange-500',
        dueDate: 'Aug 4',
        tags: [{ label: 'Backend' }, { label: 'DB' }],
      },
      {
        id: 'c4',
        title: 'Guest auth flow with JWT issuance',
        assignee: 'Alex Kim',
        avatarColor: 'bg-violet-500',
        dueDate: 'Aug 7',
        tags: [{ label: 'Auth' }],
      },
    ],
  },
  {
    id: 'onhold',
    title: 'On Hold',
    tasks: [
      {
        id: 'h1',
        title: 'Integrate third-party analytics SDK',
        assignee: 'Alex Kim',
        avatarColor: 'bg-violet-500',
        dueDate: 'Sep 1',
        tags: [{ label: 'Analytics' }],
      },
      {
        id: 'h2',
        title: 'Mobile responsive layout pass',
        assignee: 'Jordan Park',
        avatarColor: 'bg-pink-500',
        dueDate: 'Sep 5',
        tags: [{ label: 'Frontend' }, { label: 'Mobile' }],
      },
    ],
  },
];
