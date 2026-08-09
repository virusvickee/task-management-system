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
      {/* ── Mobile/Tablet backdrop (only below lg) ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──
          • Mobile/tablet (<lg): fixed off-canvas drawer, slides in over content
          • Desktop (≥lg): static inline column, always visible
      ── */}
      <div
        className={[
          // Shared
          'flex shrink-0 h-full',
          // Mobile/tablet: fixed overlay drawer
          'fixed inset-y-0 left-0 z-50',
          'transition-transform duration-200 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static, part of normal flow
          'lg:relative lg:translate-x-0 lg:z-auto',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
