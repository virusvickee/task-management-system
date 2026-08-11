'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/context/theme-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/dashboard/settings');
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const { theme } = useTheme();

  if (isSettings) return <>{children}</>;

  const bg = theme === 'dark' ? '#111111' : '#ffffff';

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: bg }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={[
          'flex shrink-0 h-full',
          'fixed inset-y-0 left-0 z-50',
          'transition-all duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:z-auto',
          sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:translate-x-0 lg:overflow-hidden',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
