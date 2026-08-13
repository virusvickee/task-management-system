'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Settings, Sun, Moon, Check } from 'lucide-react';
import { useTheme, ACCENT_COLORS } from '@/context/theme-context';
import type { AccentColor } from '@/context/theme-context';
import { cn } from '@/lib/utils';

type ThemeOption = 'light' | 'dark';

export default function UserMenuDropdown({
  user,
  onClose,
  className,
  mobile = false,
}: {
  user?: { name?: string; email?: string } | null;
  onClose: () => void;
  className?: string;
  mobile?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [submenu, setSubmenu] = useState<'theme' | 'color' | null>(null);
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  useEffect(() => {
    if (mobile) return;
    const handler = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [mobile, onClose]);

  useEffect(() => {
    if (!mobile) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobile, onClose]);

  const currentAccent = ACCENT_COLORS.find((c) => c.label === accentColor) ?? ACCENT_COLORS[0];
  const itemClass = (active = false) =>
    cn(
      'fields-dropdown-item user-menu-dropdown-item w-full flex items-center gap-2.5 rounded-lg transition-colors',
      mobile ? 'px-3 py-2.5 text-[14px] min-h-[44px]' : 'px-2.5 py-2 text-[13px]',
      active && 'fields-dropdown-item--active',
    );

  const submenuPanelClass = mobile
    ? 'user-menu-dropdown__submenu'
    : 'theme-popover absolute left-0 top-full mt-0.5 w-[192px] max-w-[calc(100vw-24px)] rounded-md py-1.5 z-[9999] select-none lg:left-full lg:top-0 lg:mt-0 lg:ml-1';

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Account menu"
      className={cn(
        'theme-popover user-menu-dropdown select-none shadow-md',
        mobile
          ? 'user-menu-dropdown--mobile fixed z-[9999]'
          : 'absolute z-[9999] w-[min(280px,calc(100vw-24px))] min-w-[192px] rounded-md py-2',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-col items-center border-b border-[color:var(--base-border)]',
          mobile ? 'px-4 py-4' : 'px-4 pb-3 mb-1 mt-1',
        )}
      >
        <div
          className={cn(
            'rounded-full shrink-0 overflow-hidden relative mb-2',
            mobile ? 'w-12 h-12' : 'w-10 h-10',
          )}
        >
          <img src="/avatar.png" alt={user?.name || 'Guest'} className="w-full h-full object-cover" />
        </div>
        <p className={cn('font-bold text-[var(--base-primary)]', mobile ? 'text-[15px]' : 'text-[13px]')}>
          {user?.name || 'Guest'}
        </p>
        <p className={cn('theme-popover-muted mt-0.5 text-center break-all', mobile ? 'text-[12px]' : 'text-[11px]')}>
          {user?.email || '—'}
        </p>
      </div>

      <div className={cn('flex flex-col', mobile ? 'px-2 py-2 gap-1' : 'px-1.5 gap-0.5')}>
        <div className={mobile ? '' : 'relative'}>
          <button
            type="button"
            role="menuitem"
            onClick={() => setSubmenu((value) => (value === 'theme' ? null : 'theme'))}
            onMouseEnter={mobile ? undefined : () => setSubmenu('theme')}
            className={itemClass(submenu === 'theme')}
          >
            <Sun size={mobile ? 16 : 14} className="shrink-0" />
            <span className="flex-1 text-left">Light / Dark</span>
            {mobile ? (
              <ChevronDown
                size={16}
                className={cn('fields-dropdown-item-icon shrink-0 transition-transform', submenu === 'theme' && 'rotate-180')}
              />
            ) : (
              <ChevronRight size={13} className="fields-dropdown-item-icon shrink-0" />
            )}
          </button>
          {submenu === 'theme' && (
            <div className={submenuPanelClass}>
              {(['light', 'dark'] as ThemeOption[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setTheme(value); setSubmenu(null); }}
                  className={itemClass()}
                >
                  {value === 'light'
                    ? <Sun size={mobile ? 16 : 13} className="shrink-0" />
                    : <Moon size={mobile ? 16 : 13} className="shrink-0" />}
                  <span className="flex-1 text-left capitalize">{value}</span>
                  {theme === value && <Check size={mobile ? 14 : 12} className="shrink-0 text-[var(--accent-color)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={mobile ? '' : 'relative'}>
          <button
            type="button"
            role="menuitem"
            onClick={() => setSubmenu((value) => (value === 'color' ? null : 'color'))}
            onMouseEnter={mobile ? undefined : () => setSubmenu('color')}
            className={itemClass(submenu === 'color')}
          >
            <span className={`w-3.5 h-3.5 rounded-sm ${currentAccent.swatch} shrink-0`} />
            <span className="flex-1 text-left">Accent Color</span>
            {mobile ? (
              <ChevronDown
                size={16}
                className={cn('fields-dropdown-item-icon shrink-0 transition-transform', submenu === 'color' && 'rotate-180')}
              />
            ) : (
              <ChevronRight size={13} className="fields-dropdown-item-icon shrink-0" />
            )}
          </button>
          {submenu === 'color' && (
            <div className={submenuPanelClass}>
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.label}
                  type="button"
                  onClick={() => { setAccentColor(color.label as AccentColor); setSubmenu(null); onClose(); }}
                  className={itemClass()}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm ${color.swatch} shrink-0`} />
                  <span className="flex-1 text-left">{color.label}</span>
                  {accentColor === color.label && <Check size={mobile ? 14 : 12} className="shrink-0 text-[var(--accent-color)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="fields-dropdown-divider my-1" />

        <Link
          href="/dashboard/settings"
          role="menuitem"
          onMouseEnter={mobile ? undefined : () => setSubmenu(null)}
          onClick={onClose}
          className={itemClass()}
        >
          <Settings size={mobile ? 16 : 14} className="shrink-0" />
          <span className="flex-1 text-left">Settings</span>
        </Link>
      </div>
    </div>
  );
}
