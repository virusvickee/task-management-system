'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import UserMenuDropdown from '@/components/UserMenuDropdown';
import MobileDropdownBackdrop from '@/components/MobileDropdownBackdrop';
import { cn } from '@/lib/utils';

export default function MobileUserMenu({ className }: { className?: string }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('tms-token')) return;
    apiFetch('/users/me')
      .then(setUser)
      .catch(() => {});
  }, [menuOpen, pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={cn('relative shrink-0 lg:hidden', className)}>
      <button
        type="button"
        onClick={() => setMenuOpen((value) => !value)}
        className="mobile-user-menu__trigger"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={user?.name ? `Account menu, ${user.name}` : 'Account menu'}
      >
        <img
          src="/avatar.png"
          alt=""
          className="mobile-user-menu__avatar"
        />
      </button>

      {mounted && menuOpen && createPortal(
        <>
          <MobileDropdownBackdrop onClose={closeMenu} />
          <UserMenuDropdown
            user={user}
            onClose={closeMenu}
            mobile
          />
        </>,
        document.body,
      )}
    </div>
  );
}
