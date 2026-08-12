'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/context/sidebar-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettings = pathname.startsWith('/dashboard/settings');
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  if (isSettings) return <>{children}</>;

  return (
    <div className="dashboard-app-shell flex h-screen overflow-hidden relative">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <div
        className={[
          'dashboard-sidebar-slot',
          'fixed inset-y-0 left-0 z-50',
          'transition-all duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:z-auto lg:translate-x-0',
          sidebarOpen ? 'dashboard-sidebar-slot--open' : 'dashboard-sidebar-slot--closed',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
        data-sidebar-open={sidebarOpen ? 'true' : 'false'}
      >
        {children}
      </div>
    </div>
  );
}
