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
    <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden relative">
      {/* Mobile/Tablet Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative md:z-0 flex transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <Sidebar />
      </div>

      {/* Main page content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </div>
    </div>
  );
}
