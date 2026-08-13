'use client';

import { useLayoutEffect, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useSidebar } from '@/context/sidebar-context';
import { LOGIN_PATH } from '@/lib/api';
import { setAuthCookie } from '@/lib/auth-cookie';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useLayoutEffect(() => {
    const token = localStorage.getItem('tms-token');
    if (token) {
      setAuthCookie();
      setAuthReady(true);
      return;
    }
    router.replace(LOGIN_PATH);
  }, [router]);

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--base-muted-foreground)]">Loading…</p>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { sidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/dashboard/projects');
    router.prefetch('/dashboard/settings');
  }, [router]);

  return (
    <div className="dashboard-app-shell flex h-screen overflow-hidden relative">
      {/* Desktop sidebar only — mobile uses bottom nav */}
      <div
        className={[
          'dashboard-sidebar-slot hidden lg:block',
          sidebarOpen ? 'dashboard-sidebar-slot--open' : 'dashboard-sidebar-slot--closed',
        ].join(' ')}
      >
        <Sidebar />
      </div>

      <div
        className="dashboard-main-with-bottom-nav flex-1 flex flex-col min-w-0 h-full overflow-hidden"
        data-sidebar-open={sidebarOpen ? 'true' : 'false'}
        data-mobile-nav={isMobile ? 'true' : 'false'}
      >
        {children}
      </div>

      <MobileBottomNav />
    </div>
  );
}
