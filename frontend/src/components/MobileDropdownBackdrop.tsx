'use client';

export default function MobileDropdownBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="mobile-dropdown-backdrop"
      aria-label="Close menu"
      onClick={onClose}
    />
  );
}
