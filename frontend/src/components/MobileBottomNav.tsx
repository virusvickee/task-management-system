'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useState } from 'react';
import { Settings } from 'lucide-react';

function TasksNavIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={active ? 'text-[var(--accent)]' : 'text-[var(--base-muted-foreground)]'}
    >
      <rect x="2.75" y="2.75" width="5" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="2.75" width="3.5" height="4.75" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.75" y="6" width="5" height="7.25" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9.25" y="8.75" width="3.5" height="4.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ProjectsNavIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={active ? 'text-[var(--accent)]' : 'text-[var(--base-muted-foreground)]'}
    >
      <path d="M5.5 2.83h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2.75 5.25h10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2.75" y="6.75" width="10.5" height="7.16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  if (!isMobile) return null;

  const tasksActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/tasks');
  const projectsActive = pathname.startsWith('/dashboard/projects');
  const settingsActive = pathname.startsWith('/dashboard/settings');

  const linkClass = (active: boolean) =>
    [
      'mobile-bottom-nav__link',
      active ? 'mobile-bottom-nav__link--active' : '',
    ].join(' ');

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      <Link href="/dashboard" className={linkClass(tasksActive)} aria-current={tasksActive ? 'page' : undefined}>
        <TasksNavIcon active={tasksActive} />
        <span>Tasks</span>
      </Link>
      <Link
        href="/dashboard/projects"
        className={linkClass(projectsActive)}
        aria-current={projectsActive ? 'page' : undefined}
      >
        <ProjectsNavIcon active={projectsActive} />
        <span>Projects</span>
      </Link>
      <Link
        href="/dashboard/settings"
        className={linkClass(settingsActive)}
        aria-current={settingsActive ? 'page' : undefined}
      >
        <Settings
          size={20}
          strokeWidth={1.75}
          className={settingsActive ? 'text-[var(--accent)]' : 'text-[var(--base-muted-foreground)]'}
        />
        <span>Settings</span>
      </Link>
    </nav>
  );
}
